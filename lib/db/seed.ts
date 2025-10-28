import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
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

    // Create Admin User
    console.log('👤 Creating admin user...')
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@acims.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    })

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
    ])

    // Create Meal Sessions
    console.log('🍽️  Creating meal sessions...')
    const mealSessions = await MealSession.insertMany([
      {
        name: 'Breakfast',
        code: 'BKF',
        startTime: '07:00',
        endTime: '09:00',
        description: 'Morning breakfast service',
        status: 'ACTIVE',
        displayOrder: 1,
      },
      {
        name: 'Lunch',
        code: 'LUN',
        startTime: '12:00',
        endTime: '14:00',
        description: 'Afternoon lunch service',
        status: 'ACTIVE',
        displayOrder: 2,
      },
      {
        name: 'Dinner',
        code: 'DIN',
        startTime: '19:00',
        endTime: '21:00',
        description: 'Evening dinner service',
        status: 'ACTIVE',
        displayOrder: 3,
      },
    ])

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
    // Create category IDs for seed data (in real app, these would come from InventoryCategory collection)
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

    console.log('✅ Seed completed successfully!')
    console.log('')
    console.log('📝 Login Credentials:')
    console.log('   Email: admin@acims.com')
    console.log('   Password: admin123')
    console.log('')
    console.log('📊 Created:')
    console.log(`   - ${departments.length} Departments`)
    console.log(`   - ${shifts.length} Shifts`)
    console.log(`   - ${employees.length} Employees`)
    console.log(`   - ${mealSessions.length} Meal Sessions`)
    console.log(`   - ${vendors.length} Vendors`)
    console.log(`   - ${inventoryItems.length} Inventory Items`)
    console.log(`   - ${stockMovements.length} Stock Movements`)
    console.log(`   - ${reconciliations.length} Reconciliations`)
    console.log('')

    process.exit(0)
  } catch (error) {
    console.error('❌ Seed failed:', error)
    process.exit(1)
  }
}

seed()
