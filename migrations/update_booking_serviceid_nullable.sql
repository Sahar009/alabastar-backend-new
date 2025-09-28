-- Migration to make serviceId nullable in bookings table
-- This allows bookings without specific service selection

-- Step 1: Check current data types (run these manually first)
-- DESCRIBE bookings;
-- DESCRIBE services;

-- Step 2: Drop the existing foreign key constraint
ALTER TABLE bookings DROP FOREIGN KEY bookings_ibfk_3;

-- Step 3: Ensure both columns have the same data type
-- If services.id is CHAR(36), use CHAR(36) for serviceId
-- If services.id is VARCHAR(36), use VARCHAR(36) for serviceId
-- If services.id is BINARY(16), use BINARY(16) for serviceId

-- Option A: If services.id is CHAR(36) (most common for UUID)
ALTER TABLE bookings MODIFY COLUMN serviceId CHAR(36) NULL;

-- Option B: If services.id is VARCHAR(36), uncomment this instead:
-- ALTER TABLE bookings MODIFY COLUMN serviceId VARCHAR(36) NULL;

-- Option C: If services.id is BINARY(16), uncomment this instead:
-- ALTER TABLE bookings MODIFY COLUMN serviceId BINARY(16) NULL;

-- Step 4: Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE bookings ADD CONSTRAINT bookings_service_fk 
FOREIGN KEY (serviceId) REFERENCES services(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add a comment to document the change
ALTER TABLE bookings MODIFY COLUMN serviceId CHAR(36) NULL COMMENT 'Optional service ID - can be NULL for general bookings';
