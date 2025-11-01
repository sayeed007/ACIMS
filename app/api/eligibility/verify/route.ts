import { NextRequest, NextResponse } from 'next/server'
import connectDB from '@/lib/db/mongoose'
import EligibilityRule from '@/lib/db/models/EligibilityRule'
import Employee from '@/lib/db/models/Employee'
import EmployeeAttendance from '@/lib/db/models/EmployeeAttendance'
import MealSession from '@/lib/db/models/MealSession'
import MealTransaction from '@/lib/db/models/MealTransaction'
import { successResponse, errorResponse, validationError } from '@/lib/utils/api-response'
import { getCurrentUser } from '@/lib/utils/auth-helpers'

/**
 * POST /api/eligibility/verify - Verify employee meal eligibility
 *
 * Request body:
 * {
 *   employeeId: string,
 *   mealSessionId: string,
 *   timestamp?: string (ISO format, defaults to now)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json(
        errorResponse('UNAUTHORIZED', 'Authentication required', null, 401),
        { status: 401 }
      )
    }

    const body = await request.json()

    if (!body.employeeId || !body.mealSessionId) {
      return NextResponse.json(
        validationError('Employee ID and Meal Session ID are required'),
        { status: 400 }
      )
    }

    await connectDB()

    const timestamp = body.timestamp ? new Date(body.timestamp) : new Date()
    const currentTime = timestamp.toTimeString().slice(0, 5) // HH:mm format
    const currentDate = timestamp.toISOString().split('T')[0] // YYYY-MM-DD

    // Fetch employee details
    const employee = await Employee.findOne({
      _id: body.employeeId,
      isDeleted: false,
      status: 'ACTIVE'
    }).populate('shift').populate('department')

    if (!employee) {
      return NextResponse.json(
        successResponse({
          eligible: false,
          reason: 'Employee not found or inactive',
          employeeId: body.employeeId,
          timestamp: timestamp.toISOString(),
        })
      )
    }

    // Fetch meal session details
    const mealSession = await MealSession.findOne({
      _id: body.mealSessionId,
      isDeleted: false,
      isActive: true,
    })

    if (!mealSession) {
      return NextResponse.json(
        successResponse({
          eligible: false,
          reason: 'Meal session not found or inactive',
          employee: {
            id: employee._id,
            name: employee.name,
            employeeId: employee.employeeId,
          },
          timestamp: timestamp.toISOString(),
        })
      )
    }

    // Check if current time is within meal session window
    if (currentTime < mealSession.startTime || currentTime > mealSession.endTime) {
      return NextResponse.json(
        successResponse({
          eligible: false,
          reason: `Meal session time window: ${mealSession.startTime} - ${mealSession.endTime}`,
          employee: {
            id: employee._id,
            name: employee.name,
            employeeId: employee.employeeId,
            department: employee.department?.name,
          },
          mealSession: {
            id: mealSession._id,
            name: mealSession.name,
            startTime: mealSession.startTime,
            endTime: mealSession.endTime,
          },
          timestamp: timestamp.toISOString(),
        })
      )
    }

    // Fetch applicable eligibility rules (ordered by priority)
    const rules = await EligibilityRule.find({
      'mealSession.id': mealSession._id,
      isActive: true,
      isDeleted: false,
    }).sort({ priority: -1 })

    let matchedRule = null
    let eligibilityReasons: string[] = []

    // Check each rule in priority order
    for (const rule of rules) {
      let matches = true
      const reasons: string[] = []

      // Check shift eligibility
      if (rule.applicableFor.shifts && rule.applicableFor.shifts.length > 0) {
        const shiftMatches = rule.applicableFor.shifts.some(
          (shiftId: any) => shiftId.toString() === employee.shift?.id?.toString()
        )
        if (!shiftMatches) {
          matches = false
          reasons.push('Shift not eligible')
        }
      }

      // Check department eligibility
      if (rule.applicableFor.departments && rule.applicableFor.departments.length > 0) {
        const deptMatches = rule.applicableFor.departments.some(
          (deptId: any) => deptId.toString() === employee.department?.id?.toString()
        )
        if (!deptMatches) {
          matches = false
          reasons.push('Department not eligible')
        }
      }

      // Check employee type
      if (rule.applicableFor.employeeTypes && rule.applicableFor.employeeTypes.length > 0) {
        if (!rule.applicableFor.employeeTypes.includes(employee.employmentType)) {
          matches = false
          reasons.push('Employment type not eligible')
        }
      }

      // Check specific employees
      if (rule.applicableFor.specificEmployees && rule.applicableFor.specificEmployees.length > 0) {
        const employeeMatches = rule.applicableFor.specificEmployees.some(
          (empId: any) => empId.toString() === employee._id.toString()
        )
        if (!employeeMatches) {
          matches = false
          reasons.push('Not in specific employee list')
        }
      }

      // Check attendance requirement
      if (rule.requiresAttendance) {
        const attendance = await EmployeeAttendance.findOne({
          employee: employee._id,
          date: currentDate,
        })

        if (!attendance || attendance.status !== 'PRESENT') {
          matches = false
          reasons.push('Attendance not marked as PRESENT')
        }

        // Check OT requirement
        if (rule.requiresOT && (!attendance || !attendance.overtimeHours || attendance.overtimeHours <= 0)) {
          matches = false
          reasons.push('OT hours required')
        }
      }

      // Check time window (if specified in rule)
      if (rule.timeWindow) {
        if (currentTime < rule.timeWindow.startTime || currentTime > rule.timeWindow.endTime) {
          matches = false
          reasons.push(`Time window: ${rule.timeWindow.startTime} - ${rule.timeWindow.endTime}`)
        }
      }

      // Check max meals per day
      if (rule.maxMealsPerDay) {
        const todayMeals = await MealTransaction.countDocuments({
          employee: employee._id,
          date: currentDate,
          status: 'APPROVED',
        })

        if (todayMeals >= rule.maxMealsPerDay) {
          matches = false
          reasons.push(`Max meals per day limit reached (${rule.maxMealsPerDay})`)
        }
      }

      if (matches) {
        matchedRule = rule
        eligibilityReasons.push(`Matched rule: ${rule.ruleName}`)
        break // Found a matching rule, no need to check further
      } else {
        eligibilityReasons.push(...reasons)
      }
    }

    // Determine final eligibility
    const eligible = matchedRule !== null

    return NextResponse.json(
      successResponse({
        eligible,
        reason: eligible
          ? `Eligible via rule: ${matchedRule.ruleName}`
          : eligibilityReasons.join(', ') || 'No matching eligibility rule found',
        employee: {
          id: employee._id,
          name: employee.name,
          employeeId: employee.employeeId,
          department: employee.department?.name,
          shift: employee.shift?.name,
          employmentType: employee.employmentType,
        },
        mealSession: {
          id: mealSession._id,
          name: mealSession.name,
          startTime: mealSession.startTime,
          endTime: mealSession.endTime,
        },
        matchedRule: matchedRule ? {
          id: matchedRule._id,
          name: matchedRule.ruleName,
          priority: matchedRule.priority,
        } : null,
        timestamp: timestamp.toISOString(),
        displayColor: eligible ? 'green' : 'red',
        message: eligible ? 'Meal Authorized' : 'Not Authorized',
      })
    )
  } catch (error: any) {
    console.error('Meal eligibility verification error:', error)
    return NextResponse.json(
      errorResponse('INTERNAL_ERROR', error.message || 'Failed to verify eligibility', null, 500),
      { status: 500 }
    )
  }
}
