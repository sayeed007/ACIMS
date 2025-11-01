import mongoose from 'mongoose'
import connectDB from './mongoose'
import User from './models/User'
import Employee from './models/Employee'
import Department from './models/Department'
import Shift from './models/Shift'
import MealSession from './models/MealSession'
import InventoryItem from './models/InventoryItem'
import StockMovement from './models/StockMovement'
import Reconciliation from './models/Reconciliation'
import Vendor from './models/Vendor'
import Device from './models/Device'
import EmployeeAttendance from './models/EmployeeAttendance'
import MealTransaction from './models/MealTransaction'
import EligibilityRule from './models/EligibilityRule'
import AccessControlRule from './models/AccessControlRule'
import PurchaseDemand from './models/PurchaseDemand'
import PurchaseOrder from './models/PurchaseOrder'
import Bill from './models/Bill'
import Notification from './models/Notification'
import AuditLog from './models/AuditLog'

async function seed() {
  try {
    console.log('🌱 Starting database seed...')

    await connectDB()

    // Clear existing data
    console.log('🗑️  Clearing existing data...')
    await User.deleteMany({})
    await Employee.deleteMany({})
    await Department.deleteMany({})
    await Shift.deleteMany({})
    await MealSession.deleteMany({})
    await InventoryItem.deleteMany({})
    await StockMovement.deleteMany({})
    await Reconciliation.deleteMany({})
    await Vendor.deleteMany({})
    await Device.deleteMany({})
    await EmployeeAttendance.deleteMany({})
    await MealTransaction.deleteMany({})
    await EligibilityRule.deleteMany({})
    await AccessControlRule.deleteMany({})
    await PurchaseDemand.deleteMany({})
    await PurchaseOrder.deleteMany({})
    await Bill.deleteMany({})
    await Notification.deleteMany({})
    await AuditLog.deleteMany({})

    // Create Admin User
    console.log('👤 Creating admin user...')
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@acims.com',
      password: 'admin123',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    })

    // Create Additional Users
    console.log('👥 Creating additional users...')
    const managerUser = await User.create({
      name: 'Manager User',
      email: 'manager@acims.com',
      password: 'manager123',
      role: 'ADMIN',
      status: 'ACTIVE',
    })

    const storeUser = await User.create({
      name: 'Store Keeper',
      email: 'store@acims.com',
      password: 'store123',
      role: 'USER',
      status: 'ACTIVE',
    })

    // Create Access Control Rules
    console.log('🔐 Creating access control rules...')
    const accessRules = await AccessControlRule.insertMany([
      {
        roleName: 'SUPER_ADMIN',
        description: 'Full system access with all permissions',
        permissions: [
          'employees:view', 'employees:create', 'employees:update', 'employees:delete',
          'departments:view', 'departments:create', 'departments:update', 'departments:delete',
          'shifts:view', 'shifts:create', 'shifts:update', 'shifts:delete',
          'meals:view', 'meals:create', 'meals:update', 'meals:delete',
          'meal-sessions:view', 'meal-sessions:create', 'meal-sessions:update', 'meal-sessions:delete',
          'inventory:view', 'inventory:create', 'inventory:update', 'inventory:delete',
          'procurement:view', 'procurement:create', 'procurement:update', 'procurement:delete',
          'reports:view', 'reports:export',
          'settings:view', 'settings:update',
          'users:view', 'users:create', 'users:update', 'users:delete',
          'eligibility:view', 'eligibility:create', 'eligibility:update', 'eligibility:delete',
          'approve:demands', 'approve:reconciliations', 'approve:guest-meals',
        ],
        moduleAccess: {
          dashboard: true,
          employees: true,
          departments: true,
          shifts: true,
          mealSessions: true,
          mealTransactions: true,
          inventory: true,
          procurement: true,
          reports: true,
          settings: true,
          eligibility: true,
        },
        dataScope: {
          type: 'ALL',
        },
        restrictions: {
          canExport: true,
          canDelete: true,
          canApprove: true,
        },
        isSystemRole: true,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
      {
        roleName: 'MANAGER',
        description: 'Manager role with approval permissions',
        permissions: [
          'employees:view', 'departments:view', 'shifts:view',
          'meals:view', 'meal-sessions:view',
          'inventory:view', 'procurement:view', 'procurement:create',
          'reports:view', 'reports:export',
          'approve:demands', 'approve:reconciliations',
        ],
        moduleAccess: {
          dashboard: true,
          employees: true,
          departments: true,
          shifts: true,
          mealSessions: true,
          mealTransactions: true,
          inventory: true,
          procurement: true,
          reports: true,
          settings: false,
          eligibility: true,
        },
        dataScope: {
          type: 'ALL',
        },
        restrictions: {
          canExport: true,
          canDelete: false,
          canApprove: true,
        },
        isSystemRole: false,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
      {
        roleName: 'STORE_KEEPER',
        description: 'Store keeper with inventory management access',
        permissions: [
          'inventory:view', 'inventory:create', 'inventory:update',
          'procurement:view',
          'reports:view',
        ],
        moduleAccess: {
          dashboard: true,
          employees: false,
          departments: false,
          shifts: false,
          mealSessions: false,
          mealTransactions: false,
          inventory: true,
          procurement: true,
          reports: true,
          settings: false,
          eligibility: false,
        },
        dataScope: {
          type: 'OWN',
        },
        restrictions: {
          canExport: false,
          canDelete: false,
          canApprove: false,
        },
        isSystemRole: false,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
    ])

    // Create Departments
    console.log('🏢 Creating departments...')
    const departments = await Department.insertMany([
      {
        name: 'Kitchen',
        code: 'KIT',
        description: 'Main kitchen and food preparation',
        status: 'ACTIVE',
        headOfDepartment: adminUser._id,
        createdBy: adminUser._id,
      },
      {
        name: 'Service',
        code: 'SRV',
        description: 'Food service and customer interaction',
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        name: 'Store',
        code: 'STR',
        description: 'Inventory and storage management',
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        name: 'Administration',
        code: 'ADM',
        description: 'Administrative and management',
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
    ])

    // Create Shifts
    console.log('⏰ Creating shifts...')
    const shifts = await Shift.insertMany([
      {
        name: 'Morning Shift',
        code: 'MORNING',
        startTime: '06:00',
        endTime: '14:00',
        status: 'ACTIVE',
      },
      {
        name: 'Evening Shift',
        code: 'EVENING',
        startTime: '14:00',
        endTime: '22:00',
        status: 'ACTIVE',
      },
      {
        name: 'Night Shift',
        code: 'NIGHT',
        startTime: '22:00',
        endTime: '06:00',
        status: 'ACTIVE',
      },
    ])

    // Create Meal Sessions
    console.log('🍽️  Creating meal sessions...')
    const mealSessions = await MealSession.insertMany([
      {
        name: 'Breakfast',
        code: 'BKF',
        mealType: 'BREAKFAST',
        startTime: '07:00',
        endTime: '09:00',
        description: 'Morning breakfast service',
        status: 'ACTIVE',
        displayOrder: 1,
        maxCapacity: 100,
      },
      {
        name: 'Lunch',
        code: 'LUN',
        mealType: 'LUNCH',
        startTime: '12:00',
        endTime: '14:00',
        description: 'Afternoon lunch service',
        status: 'ACTIVE',
        displayOrder: 2,
        maxCapacity: 150,
      },
      {
        name: 'Dinner',
        code: 'DIN',
        mealType: 'DINNER',
        startTime: '19:00',
        endTime: '21:00',
        description: 'Evening dinner service',
        status: 'ACTIVE',
        displayOrder: 3,
        maxCapacity: 120,
      },
    ])

    // Create Eligibility Rules
    console.log('📋 Creating eligibility rules...')
    const eligibilityRules = await EligibilityRule.insertMany([
      {
        ruleName: 'Morning Shift - Breakfast',
        description: 'Morning shift employees are eligible for breakfast',
        mealSession: {
          id: mealSessions[0]._id,
          name: mealSessions[0].name,
        },
        applicableFor: {
          shifts: [shifts[0]._id],
          employeeTypes: ['PERMANENT', 'CONTRACT', 'VENDOR'],
        },
        timeWindow: {
          startTime: '07:00',
          endTime: '09:00',
        },
        requiresAttendance: true,
        requiresOT: false,
        priority: 10,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
      {
        ruleName: 'All Shifts - Lunch',
        description: 'All employees are eligible for lunch',
        mealSession: {
          id: mealSessions[1]._id,
          name: mealSessions[1].name,
        },
        applicableFor: {
          shifts: [shifts[0]._id, shifts[1]._id, shifts[2]._id],
          employeeTypes: ['PERMANENT', 'CONTRACT', 'VENDOR'],
        },
        timeWindow: {
          startTime: '12:00',
          endTime: '14:00',
        },
        requiresAttendance: true,
        requiresOT: false,
        priority: 10,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
      {
        ruleName: 'Evening/Night Shift - Dinner',
        description: 'Evening and night shift employees are eligible for dinner',
        mealSession: {
          id: mealSessions[2]._id,
          name: mealSessions[2].name,
        },
        applicableFor: {
          shifts: [shifts[1]._id, shifts[2]._id],
          employeeTypes: ['PERMANENT', 'CONTRACT', 'VENDOR'],
        },
        timeWindow: {
          startTime: '19:00',
          endTime: '21:00',
        },
        requiresAttendance: true,
        requiresOT: false,
        priority: 10,
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
      {
        ruleName: 'Overtime - Dinner',
        description: 'Employees with approved OT get dinner',
        mealSession: {
          id: mealSessions[2]._id,
          name: mealSessions[2].name,
        },
        applicableFor: {
          employeeTypes: ['PERMANENT', 'CONTRACT'],
        },
        timeWindow: {
          startTime: '19:00',
          endTime: '22:00',
        },
        requiresAttendance: true,
        requiresOT: true,
        priority: 20,
        conditions: {
          minWorkHours: 10,
        },
        isActive: true,
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        isDeleted: false,
      },
    ])

    // Create Employees
    console.log('👥 Creating employees...')
    const employees = await Employee.insertMany([
      {
        employeeId: 'EMP001',
        name: 'Rajesh Kumar',
        email: 'rajesh.kumar@acims.com',
        phone: '+91 98765 43210',
        department: {
          id: departments[0]._id,
          name: departments[0].name,
        },
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        employmentType: 'PERMANENT',
        designation: 'Head Chef',
        joiningDate: new Date('2023-01-15'),
        status: 'ACTIVE',
        hrmsData: {
          systemType: 'PERMANENT_HRMS',
          externalId: 'HRMS-EMP001',
        },
        biometricData: {
          faceTemplateId: 'BIO001',
          faceDataSynced: false,
        },
        createdBy: adminUser._id,
      },
      {
        employeeId: 'EMP002',
        name: 'Priya Sharma',
        email: 'priya.sharma@acims.com',
        phone: '+91 98765 43211',
        department: {
          id: departments[1]._id,
          name: departments[1].name,
        },
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        employmentType: 'PERMANENT',
        designation: 'Service Manager',
        joiningDate: new Date('2023-02-01'),
        status: 'ACTIVE',
        hrmsData: {
          systemType: 'PERMANENT_HRMS',
          externalId: 'HRMS-EMP002',
        },
        biometricData: {
          faceTemplateId: 'BIO002',
          faceDataSynced: false,
        },
        createdBy: adminUser._id,
      },
      {
        employeeId: 'EMP003',
        name: 'Amit Patel',
        email: 'amit.patel@acims.com',
        phone: '+91 98765 43212',
        department: {
          id: departments[2]._id,
          name: departments[2].name,
        },
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        employmentType: 'PERMANENT',
        designation: 'Store Keeper',
        joiningDate: new Date('2023-03-01'),
        status: 'ACTIVE',
        hrmsData: {
          systemType: 'PERMANENT_HRMS',
          externalId: 'HRMS-EMP003',
        },
        biometricData: {
          faceTemplateId: 'BIO003',
          faceDataSynced: false,
        },
        createdBy: adminUser._id,
      },
      {
        employeeId: 'EMP004',
        name: 'Sunita Reddy',
        email: 'sunita.reddy@acims.com',
        phone: '+91 98765 43213',
        department: {
          id: departments[0]._id,
          name: departments[0].name,
        },
        shift: {
          id: shifts[1]._id,
          name: shifts[1].name,
        },
        employmentType: 'CONTRACT',
        designation: 'Cook',
        joiningDate: new Date('2024-01-10'),
        status: 'ACTIVE',
        hrmsData: {
          systemType: 'VENDOR_HRMS',
          externalId: 'VHRMS-EMP004',
        },
        biometricData: {
          faceTemplateId: 'BIO004',
          faceDataSynced: false,
        },
        createdBy: adminUser._id,
      },
      {
        employeeId: 'EMP005',
        name: 'Vikram Singh',
        email: 'vikram.singh@acims.com',
        phone: '+91 98765 43214',
        department: {
          id: departments[1]._id,
          name: departments[1].name,
        },
        shift: {
          id: shifts[1]._id,
          name: shifts[1].name,
        },
        employmentType: 'CONTRACT',
        designation: 'Service Staff',
        joiningDate: new Date('2024-02-01'),
        status: 'ACTIVE',
        hrmsData: {
          systemType: 'VENDOR_HRMS',
          externalId: 'VHRMS-EMP005',
        },
        biometricData: {
          faceTemplateId: 'BIO005',
          faceDataSynced: false,
        },
        createdBy: adminUser._id,
      },
    ])

    // Create Devices
    console.log('📱 Creating devices...')
    const devices = await Device.insertMany([
      {
        deviceId: 'DEV001',
        deviceName: 'Cafeteria Main Entrance',
        deviceType: 'FACE_RECOGNITION',
        location: 'Main Cafeteria - Entrance',
        ipAddress: '192.168.1.100',
        macAddress: '00:1B:44:11:3A:B7',
        manufacturer: 'Hikvision',
        deviceModel: 'DS-K1T341AMF',
        firmwareVersion: 'V3.2.5',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        configuration: {
          verificationThreshold: 85,
          timeout: 30,
          displaySettings: {
            showName: true,
            showPhoto: true,
          },
        },
        statistics: {
          totalVerifications: 1250,
          successfulVerifications: 1180,
          failedVerifications: 70,
          lastVerificationAt: new Date(),
        },
        isDeleted: false,
      },
      {
        deviceId: 'DEV002',
        deviceName: 'Cafeteria Exit Scanner',
        deviceType: 'BARCODE_SCANNER',
        location: 'Main Cafeteria - Exit',
        ipAddress: '192.168.1.101',
        status: 'ONLINE',
        lastHeartbeat: new Date(),
        statistics: {
          totalVerifications: 850,
          successfulVerifications: 830,
          failedVerifications: 20,
          lastVerificationAt: new Date(),
        },
        isDeleted: false,
      },
      {
        deviceId: 'DEV003',
        deviceName: 'Admin Block Kiosk',
        deviceType: 'KIOSK',
        location: 'Admin Block - Floor 2',
        ipAddress: '192.168.1.102',
        status: 'OFFLINE',
        configuration: {
          timeout: 60,
        },
        statistics: {
          totalVerifications: 320,
          successfulVerifications: 315,
          failedVerifications: 5,
        },
        isDeleted: false,
      },
    ])

    // Create Employee Attendance
    console.log('📅 Creating employee attendance records...')
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const attendanceRecords = await EmployeeAttendance.insertMany([
      // Today's attendance
      {
        employeeId: employees[0]._id,
        employee: {
          id: employees[0].employeeId,
          name: employees[0].name,
        },
        date: today,
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        status: 'PRESENT',
        checkIn: new Date(today.setHours(6, 15)),
        checkOut: new Date(today.setHours(14, 10)),
        overtimeHours: 0,
        isOTApproved: false,
        syncedFrom: 'PERMANENT_HRMS',
        lastSyncedAt: new Date(),
      },
      {
        employeeId: employees[1]._id,
        employee: {
          id: employees[1].employeeId,
          name: employees[1].name,
        },
        date: today,
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        status: 'PRESENT',
        checkIn: new Date(today.setHours(6, 10)),
        checkOut: new Date(today.setHours(14, 5)),
        overtimeHours: 0,
        isOTApproved: false,
        syncedFrom: 'PERMANENT_HRMS',
        lastSyncedAt: new Date(),
      },
      {
        employeeId: employees[2]._id,
        employee: {
          id: employees[2].employeeId,
          name: employees[2].name,
        },
        date: today,
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        status: 'PRESENT',
        checkIn: new Date(today.setHours(6, 20)),
        overtimeHours: 0,
        isOTApproved: false,
        syncedFrom: 'PERMANENT_HRMS',
        lastSyncedAt: new Date(),
      },
      {
        employeeId: employees[3]._id,
        employee: {
          id: employees[3].employeeId,
          name: employees[3].name,
        },
        date: today,
        shift: {
          id: shifts[1]._id,
          name: shifts[1].name,
        },
        status: 'PRESENT',
        checkIn: new Date(today.setHours(14, 5)),
        overtimeHours: 2,
        isOTApproved: true,
        syncedFrom: 'VENDOR_HRMS',
        lastSyncedAt: new Date(),
      },
      {
        employeeId: employees[4]._id,
        employee: {
          id: employees[4].employeeId,
          name: employees[4].name,
        },
        date: today,
        shift: {
          id: shifts[1]._id,
          name: shifts[1].name,
        },
        status: 'LATE',
        checkIn: new Date(today.setHours(14, 35)),
        overtimeHours: 0,
        isOTApproved: false,
        syncedFrom: 'VENDOR_HRMS',
        lastSyncedAt: new Date(),
      },
      // Yesterday's attendance
      {
        employeeId: employees[0]._id,
        employee: {
          id: employees[0].employeeId,
          name: employees[0].name,
        },
        date: yesterday,
        shift: {
          id: shifts[0]._id,
          name: shifts[0].name,
        },
        status: 'PRESENT',
        checkIn: new Date(yesterday.setHours(6, 10)),
        checkOut: new Date(yesterday.setHours(14, 5)),
        overtimeHours: 0,
        isOTApproved: false,
        syncedFrom: 'PERMANENT_HRMS',
        lastSyncedAt: new Date(),
      },
    ])

    // Create Meal Transactions - Enhanced with historical data
    console.log('🍴 Creating meal transactions...')
    const mealTransactions = []

    // Generate transactions for the past 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const transactionDate = new Date(today)
      transactionDate.setDate(transactionDate.getDate() - dayOffset)

      // Breakfast transactions (3-5 meals per day)
      const breakfastCount = Math.floor(Math.random() * 3) + 3
      for (let i = 0; i < breakfastCount; i++) {
        const employee = employees[i % employees.length]
        mealTransactions.push({
          transactionId: `TXN${Date.now()}-${dayOffset}-BKF-${i}`,
          date: new Date(transactionDate),
          mealSession: {
            id: mealSessions[0]._id,
            name: mealSessions[0].name,
            code: mealSessions[0].code,
          },
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
          },
          department: {
            id: employee.department.id,
            name: employee.department.name,
          },
          shift: {
            id: employee.shift.id,
            name: employee.shift.name,
          },
          device: {
            id: devices[0].deviceId,
            name: devices[0].deviceName,
            location: devices[0].location,
          },
          verificationMethod: 'FACE_RECOGNITION',
          verificationStatus: 'AUTHORIZED',
          verificationConfidence: 85 + Math.random() * 15,
          eligibilityCheck: {
            wasEligible: true,
            attendanceStatus: 'PRESENT',
            shiftMatch: true,
          },
          isGuestMeal: false,
          cost: 45 + Math.floor(Math.random() * 15), // ₹45-60 per meal
          timestamp: new Date(transactionDate.setHours(7, 15 + i * 10)),
          isDeleted: false,
        })
      }

      // Lunch transactions (4-7 meals per day)
      const lunchCount = Math.floor(Math.random() * 4) + 4
      for (let i = 0; i < lunchCount; i++) {
        const employee = employees[i % employees.length]
        const lunchDate = new Date(transactionDate)
        mealTransactions.push({
          transactionId: `TXN${Date.now()}-${dayOffset}-LUN-${i}`,
          date: new Date(lunchDate),
          mealSession: {
            id: mealSessions[1]._id,
            name: mealSessions[1].name,
            code: mealSessions[1].code,
          },
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
          },
          department: {
            id: employee.department.id,
            name: employee.department.name,
          },
          shift: {
            id: employee.shift.id,
            name: employee.shift.name,
          },
          device: {
            id: devices[0].deviceId,
            name: devices[0].deviceName,
            location: devices[0].location,
          },
          verificationMethod: 'FACE_RECOGNITION',
          verificationStatus: 'AUTHORIZED',
          verificationConfidence: 85 + Math.random() * 15,
          eligibilityCheck: {
            wasEligible: true,
            attendanceStatus: 'PRESENT',
            shiftMatch: true,
          },
          isGuestMeal: false,
          cost: 55 + Math.floor(Math.random() * 20), // ₹55-75 per meal
          timestamp: new Date(lunchDate.setHours(12, 10 + i * 8)),
          isDeleted: false,
        })
      }

      // Dinner transactions (2-4 meals per day)
      const dinnerCount = Math.floor(Math.random() * 3) + 2
      for (let i = 0; i < dinnerCount; i++) {
        const employee = employees[i % employees.length]
        const dinnerDate = new Date(transactionDate)
        mealTransactions.push({
          transactionId: `TXN${Date.now()}-${dayOffset}-DIN-${i}`,
          date: new Date(dinnerDate),
          mealSession: {
            id: mealSessions[2]._id,
            name: mealSessions[2].name,
            code: mealSessions[2].code,
          },
          employee: {
            id: employee._id,
            employeeId: employee.employeeId,
            name: employee.name,
          },
          department: {
            id: employee.department.id,
            name: employee.department.name,
          },
          shift: {
            id: employee.shift.id,
            name: employee.shift.name,
          },
          device: {
            id: devices[0].deviceId,
            name: devices[0].deviceName,
            location: devices[0].location,
          },
          verificationMethod: 'FACE_RECOGNITION',
          verificationStatus: 'AUTHORIZED',
          verificationConfidence: 85 + Math.random() * 15,
          eligibilityCheck: {
            wasEligible: true,
            attendanceStatus: 'PRESENT',
            shiftMatch: true,
          },
          isGuestMeal: i === 0 && dayOffset % 5 === 0, // Some guest meals
          cost: 50 + Math.floor(Math.random() * 20), // ₹50-70 per meal
          timestamp: new Date(dinnerDate.setHours(19, 20 + i * 12)),
          isDeleted: false,
        })
      }
    }

    await MealTransaction.insertMany(mealTransactions)

    // Create Vendors
    console.log('🏪 Creating vendors...')
    const vendors = await Vendor.insertMany([
      {
        vendorCode: 'VEN001',
        name: 'Fresh Foods Pvt Ltd',
        category: 'FOOD',
        contactPerson: {
          name: 'Suresh Reddy',
          designation: 'Sales Manager',
          phone: '+91 98765 00001',
          email: 'suresh@freshfoods.com',
        },
        address: {
          street: '123 Market Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
        },
        businessDetails: {
          gstNumber: '29AABCT1234F1Z5',
          panNumber: 'AABCT1234F',
          registrationType: 'REGISTERED',
          businessType: 'PRIVATE_LIMITED',
        },
        paymentTerms: {
          creditDays: 30,
          paymentMode: 'NEFT',
        },
        rating: {
          quality: 4.5,
          delivery: 4.0,
          pricing: 4.2,
          overall: 4.23,
        },
        status: 'ACTIVE',
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
      {
        vendorCode: 'VEN002',
        name: 'Spice King Traders',
        category: 'INGREDIENTS',
        contactPerson: {
          name: 'Arjun Singh',
          designation: 'Owner',
          phone: '+91 98765 00002',
          email: 'arjun@spiceking.com',
        },
        address: {
          street: '456 Spice Market',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India',
        },
        businessDetails: {
          gstNumber: '27AABCT5678G1Z5',
          panNumber: 'AABCT5678G',
          registrationType: 'REGISTERED',
        },
        paymentTerms: {
          creditDays: 15,
          paymentMode: 'RTGS',
        },
        rating: {
          quality: 4.8,
          delivery: 4.5,
          pricing: 4.0,
          overall: 4.43,
        },
        status: 'ACTIVE',
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
      {
        vendorCode: 'VEN003',
        name: 'Packaging Solutions Ltd',
        category: 'PACKAGING',
        contactPerson: {
          name: 'Meera Nair',
          phone: '+91 98765 00003',
          email: 'meera@packagingsolutions.com',
        },
        address: {
          street: '789 Industrial Area',
          city: 'Chennai',
          state: 'Tamil Nadu',
          pincode: '600001',
          country: 'India',
        },
        paymentTerms: {
          creditDays: 45,
          paymentMode: 'NEFT',
        },
        status: 'ACTIVE',
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
      },
    ])

    // Create Inventory Items
    console.log('📦 Creating inventory items...')
    const categoryGrains = new mongoose.Types.ObjectId()
    const categoryOils = new mongoose.Types.ObjectId()
    const categoryVegetables = new mongoose.Types.ObjectId()
    const categorySpices = new mongoose.Types.ObjectId()
    const categoryPulses = new mongoose.Types.ObjectId()

    const inventoryItems = await InventoryItem.insertMany([
      {
        itemCode: 'RICE001',
        name: 'Basmati Rice',
        category: { id: categoryGrains, name: 'Grains' },
        unit: 'KG',
        currentStock: 500,
        reorderLevel: 100,
        avgCostPerUnit: 85,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'OIL001',
        name: 'Sunflower Oil',
        category: { id: categoryOils, name: 'Oils' },
        unit: 'LITER',
        currentStock: 150,
        reorderLevel: 50,
        avgCostPerUnit: 120,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'VEG001',
        name: 'Onions',
        category: { id: categoryVegetables, name: 'Vegetables' },
        unit: 'KG',
        currentStock: 75,
        reorderLevel: 30,
        avgCostPerUnit: 35,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'VEG002',
        name: 'Tomatoes',
        category: { id: categoryVegetables, name: 'Vegetables' },
        unit: 'KG',
        currentStock: 60,
        reorderLevel: 25,
        avgCostPerUnit: 40,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'SPICE001',
        name: 'Turmeric Powder',
        category: { id: categorySpices, name: 'Spices' },
        unit: 'KG',
        currentStock: 20,
        reorderLevel: 5,
        avgCostPerUnit: 250,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'SPICE002',
        name: 'Red Chili Powder',
        category: { id: categorySpices, name: 'Spices' },
        unit: 'KG',
        currentStock: 15,
        reorderLevel: 5,
        avgCostPerUnit: 280,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
      {
        itemCode: 'DAL001',
        name: 'Toor Dal',
        category: { id: categoryPulses, name: 'Pulses' },
        unit: 'KG',
        currentStock: 120,
        reorderLevel: 40,
        avgCostPerUnit: 110,
        status: 'ACTIVE',
        createdBy: adminUser._id,
      },
    ])

    // Create Stock Movements
    console.log('📊 Creating stock movements...')
    const stockMovements = await StockMovement.insertMany([
      {
        item: {
          id: inventoryItems[0]._id,
          itemCode: inventoryItems[0].itemCode,
          name: inventoryItems[0].name,
        },
        movementType: 'IN',
        quantity: 200,
        unit: 'kg',
        toLocation: 'Main Store',
        referenceType: 'PURCHASE_ORDER',
        referenceNumber: 'PO-2024-001',
        costPerUnit: 85,
        totalCost: 17000,
        stockBefore: 300,
        stockAfter: 500,
        performedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        status: 'COMPLETED',
        transactionDate: new Date('2024-10-20'),
      },
      {
        item: {
          id: inventoryItems[1]._id,
          itemCode: inventoryItems[1].itemCode,
          name: inventoryItems[1].name,
        },
        movementType: 'OUT',
        quantity: 50,
        unit: 'liter',
        fromLocation: 'Main Store',
        referenceType: 'CONSUMPTION',
        referenceNumber: 'CONS-2024-001',
        stockBefore: 200,
        stockAfter: 150,
        performedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        status: 'COMPLETED',
        transactionDate: new Date('2024-10-22'),
      },
      {
        item: {
          id: inventoryItems[2]._id,
          itemCode: inventoryItems[2].itemCode,
          name: inventoryItems[2].name,
        },
        movementType: 'IN',
        quantity: 100,
        unit: 'kg',
        toLocation: 'Main Store',
        referenceType: 'PURCHASE_ORDER',
        referenceNumber: 'PO-2024-002',
        costPerUnit: 35,
        totalCost: 3500,
        stockBefore: 0,
        stockAfter: 100,
        performedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        status: 'COMPLETED',
        transactionDate: new Date('2024-10-23'),
      },
    ])

    // Create Reconciliations
    console.log('🔍 Creating reconciliations...')
    const reconciliations = await Reconciliation.insertMany([
      {
        item: {
          id: inventoryItems[2]._id,
          itemCode: inventoryItems[2].itemCode,
          name: inventoryItems[2].name,
        },
        systemStock: 100,
        physicalStock: 75,
        discrepancy: -25,
        discrepancyPercentage: -25,
        unit: 'kg',
        reconciliationDate: new Date('2024-10-25'),
        location: 'Main Store',
        reason: 'Monthly stock verification',
        notes: 'Some wastage found due to quality issues',
        performedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        verifiedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          verifiedAt: new Date('2024-10-25'),
        },
        approvedBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          approvedAt: new Date('2024-10-25'),
        },
        status: 'COMPLETED',
        adjustmentReference: {
          movementId: stockMovements[0]._id,
          movementType: 'ADJUSTMENT',
          adjustmentApplied: true,
        },
      },
    ])

    // Create Purchase Demands
    console.log('📝 Creating purchase demands...')
    const purchaseDemands = await PurchaseDemand.insertMany([
      {
        demandNumber: 'PD-2024-001',
        demandDate: new Date('2024-10-28'),
        requiredByDate: new Date('2024-11-05'),
        generationType: 'MANUAL',
        items: [
          {
            item: {
              id: inventoryItems[0]._id,
              itemCode: inventoryItems[0].itemCode,
              name: inventoryItems[0].name,
            },
            currentStock: 500,
            requiredQuantity: 100,
            demandedQuantity: 200,
            unit: 'KG',
            suggestedVendors: [vendors[0]._id],
            remarks: 'Regular monthly stock',
          },
          {
            item: {
              id: inventoryItems[4]._id,
              itemCode: inventoryItems[4].itemCode,
              name: inventoryItems[4].name,
            },
            currentStock: 20,
            requiredQuantity: 10,
            demandedQuantity: 15,
            unit: 'KG',
            suggestedVendors: [vendors[1]._id],
          },
        ],
        createdBy: {
          id: storeUser._id,
          name: storeUser.name,
          email: storeUser.email,
        },
        approvalWorkflow: [
          {
            approver: {
              id: managerUser._id,
              name: managerUser.name,
              role: 'ADMIN',
            },
            status: 'APPROVED',
            approvedAt: new Date('2024-10-29'),
            comments: 'Approved for procurement',
          },
        ],
        finalStatus: 'APPROVED',
        notes: 'Regular monthly demand',
        isDeleted: false,
      },
      {
        demandNumber: 'PD-2024-002',
        demandDate: new Date('2024-10-30'),
        requiredByDate: new Date('2024-11-08'),
        generationType: 'AUTO',
        basedOnCommitments: {
          startDate: new Date('2024-11-01'),
          endDate: new Date('2024-11-30'),
          mealSessions: [mealSessions[0]._id, mealSessions[1]._id],
        },
        items: [
          {
            item: {
              id: inventoryItems[1]._id,
              itemCode: inventoryItems[1].itemCode,
              name: inventoryItems[1].name,
            },
            currentStock: 150,
            requiredQuantity: 100,
            demandedQuantity: 150,
            unit: 'LITER',
            suggestedVendors: [vendors[0]._id],
          },
        ],
        createdBy: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        approvalWorkflow: [
          {
            approver: {
              id: managerUser._id,
              name: managerUser.name,
              role: 'ADMIN',
            },
            status: 'PENDING',
          },
        ],
        finalStatus: 'SUBMITTED',
        notes: 'Auto-generated based on meal commitments',
        isDeleted: false,
      },
    ])

    // Create Purchase Orders
    console.log('📋 Creating purchase orders...')
    const purchaseOrders = await PurchaseOrder.insertMany([
      {
        poNumber: 'PO-2024-001',
        poDate: new Date('2024-10-29'),
        demandListReference: purchaseDemands[0]._id,
        vendor: {
          id: vendors[0]._id,
          vendorCode: vendors[0].vendorCode,
          name: vendors[0].name,
          contact: vendors[0].contactPerson.phone,
        },
        deliveryDate: new Date('2024-11-05'),
        deliveryAddress: 'Main Store, ACIMS Campus',
        items: [
          {
            item: {
              id: inventoryItems[0]._id,
              itemCode: inventoryItems[0].itemCode,
              name: inventoryItems[0].name,
            },
            quantity: 200,
            unit: 'KG',
            ratePerUnit: 85,
            taxPercent: 5,
            taxAmount: 850,
            totalAmount: 17850,
            receivedQuantity: 0,
            pendingQuantity: 200,
          },
        ],
        subtotal: 17000,
        totalTax: 850,
        totalAmount: 17850,
        paymentTerms: 'Net 30 days',
        createdBy: {
          id: storeUser._id,
          name: storeUser.name,
          email: storeUser.email,
        },
        approvedBy: {
          id: managerUser._id,
          name: managerUser.name,
          approvedAt: new Date('2024-10-29'),
        },
        status: 'APPROVED',
        fulfilmentStatus: {
          receiptsGenerated: 0,
          totalReceived: 0,
          pendingAmount: 17850,
        },
        notes: 'Deliver to main store between 8 AM - 12 PM',
        isDeleted: false,
      },
    ])

    // Create Bills
    console.log('💰 Creating bills...')
    const bills = await Bill.insertMany([
      {
        billNumber: 'BILL-2024-001',
        billDate: new Date('2024-10-20'),
        dueDate: new Date('2024-11-19'),
        vendor: {
          id: vendors[0]._id,
          vendorCode: vendors[0].vendorCode,
          name: vendors[0].name,
        },
        purchaseOrderReference: purchaseOrders[0]._id,
        items: [
          {
            description: 'Basmati Rice - 200 KG',
            item: {
              id: inventoryItems[0]._id,
              itemCode: inventoryItems[0].itemCode,
              name: inventoryItems[0].name,
            },
            quantity: 200,
            unit: 'KG',
            rate: 85,
            amount: 17000,
          },
        ],
        subtotal: 17000,
        tax: 850,
        totalAmount: 17850,
        paidAmount: 0,
        balanceAmount: 17850,
        enteredBy: {
          id: storeUser._id,
          name: storeUser.name,
          email: storeUser.email,
        },
        verifiedBy: {
          id: managerUser._id,
          name: managerUser.name,
          verifiedAt: new Date('2024-10-21'),
        },
        paymentStatus: 'UNPAID',
        status: 'APPROVED',
        notes: 'Payment to be made via NEFT',
        isDeleted: false,
      },
    ])

    // Create Notifications
    console.log('🔔 Creating notifications...')
    const notifications = await Notification.insertMany([
      {
        recipient: {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
        },
        type: 'INFO',
        category: 'SYSTEM',
        title: 'System Initialized',
        message: 'The food management system has been successfully initialized with seed data.',
        metadata: {
          referenceType: 'SYSTEM',
        },
        channels: {
          inApp: true,
          email: false,
          sms: false,
        },
        deliveryStatus: {
          inApp: 'DELIVERED',
        },
      },
      {
        recipient: {
          id: managerUser._id,
          name: managerUser.name,
          email: managerUser.email,
        },
        type: 'WARNING',
        category: 'PROCUREMENT',
        title: 'Purchase Demand Pending Approval',
        message: 'Purchase demand PD-2024-002 is pending your approval.',
        metadata: {
          referenceType: 'PurchaseDemand',
          referenceId: purchaseDemands[1]._id,
          actionUrl: `/procurement/demands/${purchaseDemands[1]._id}`,
        },
        channels: {
          inApp: true,
          email: true,
          sms: false,
        },
        deliveryStatus: {
          inApp: 'DELIVERED',
          email: 'PENDING',
        },
      },
      {
        recipient: {
          id: storeUser._id,
          name: storeUser.name,
          email: storeUser.email,
        },
        type: 'ALERT',
        category: 'INVENTORY',
        title: 'Low Stock Alert',
        message: 'Turmeric Powder stock is below reorder level.',
        metadata: {
          referenceType: 'InventoryItem',
          referenceId: inventoryItems[4]._id,
          actionUrl: `/inventory/items/${inventoryItems[4]._id}`,
        },
        channels: {
          inApp: true,
          email: true,
          sms: false,
        },
        deliveryStatus: {
          inApp: 'DELIVERED',
          email: 'SENT',
        },
      },
    ])

    // Create Audit Logs
    console.log('📜 Creating audit logs...')
    const auditLogs = await AuditLog.insertMany([
      {
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: 'SUPER_ADMIN',
        },
        action: 'CREATE',
        resource: 'Department',
        resourceId: departments[0]._id,
        changes: [
          {
            field: 'name',
            oldValue: null,
            newValue: 'Kitchen',
          },
          {
            field: 'code',
            oldValue: null,
            newValue: 'KIT',
          },
        ],
        metadata: {
          ip: '192.168.1.50',
          userAgent: 'Mozilla/5.0',
          method: 'POST',
          endpoint: '/api/departments',
        },
        status: 'SUCCESS',
        timestamp: new Date('2024-10-20T08:30:00'),
      },
      {
        user: {
          id: storeUser._id,
          email: storeUser.email,
          name: storeUser.name,
          role: 'USER',
        },
        action: 'UPDATE',
        resource: 'InventoryItem',
        resourceId: inventoryItems[2]._id,
        changes: [
          {
            field: 'currentStock',
            oldValue: 100,
            newValue: 75,
          },
        ],
        metadata: {
          ip: '192.168.1.51',
          userAgent: 'Mozilla/5.0',
          method: 'PUT',
          endpoint: '/api/inventory/items',
        },
        status: 'SUCCESS',
        timestamp: new Date('2024-10-25T14:20:00'),
      },
      {
        user: {
          id: managerUser._id,
          email: managerUser.email,
          name: managerUser.name,
          role: 'ADMIN',
        },
        action: 'APPROVE',
        resource: 'PurchaseDemand',
        resourceId: purchaseDemands[0]._id,
        changes: [
          {
            field: 'finalStatus',
            oldValue: 'SUBMITTED',
            newValue: 'APPROVED',
          },
        ],
        metadata: {
          ip: '192.168.1.52',
          userAgent: 'Mozilla/5.0',
          method: 'POST',
          endpoint: '/api/procurement/demands/approve',
        },
        status: 'SUCCESS',
        timestamp: new Date('2024-10-29T10:15:00'),
      },
    ])

    console.log('✅ Seed completed successfully!')
    console.log('')
    console.log('📝 Login Credentials:')
    console.log('   Super Admin:')
    console.log('     Email: admin@acims.com')
    console.log('     Password: admin123')
    console.log('')
    console.log('   Manager:')
    console.log('     Email: manager@acims.com')
    console.log('     Password: manager123')
    console.log('')
    console.log('   Store Keeper:')
    console.log('     Email: store@acims.com')
    console.log('     Password: store123')
    console.log('')
    console.log('📊 Created:')
    console.log(`   - ${3} Users`)
    console.log(`   - ${accessRules.length} Access Control Rules`)
    console.log(`   - ${departments.length} Departments`)
    console.log(`   - ${shifts.length} Shifts`)
    console.log(`   - ${mealSessions.length} Meal Sessions`)
    console.log(`   - ${eligibilityRules.length} Eligibility Rules`)
    console.log(`   - ${employees.length} Employees`)
    console.log(`   - ${devices.length} Devices`)
    console.log(`   - ${attendanceRecords.length} Attendance Records`)
    console.log(`   - ${mealTransactions.length} Meal Transactions (30 days of data)`)
    console.log(`   - ${vendors.length} Vendors`)
    console.log(`   - ${inventoryItems.length} Inventory Items`)
    console.log(`   - ${stockMovements.length} Stock Movements`)
    console.log(`   - ${reconciliations.length} Reconciliations`)
    console.log(`   - ${purchaseDemands.length} Purchase Demands`)
    console.log(`   - ${purchaseOrders.length} Purchase Orders`)
    console.log(`   - ${bills.length} Bills`)
    console.log(`   - ${notifications.length} Notifications`)
    console.log(`   - ${auditLogs.length} Audit Logs`)
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
