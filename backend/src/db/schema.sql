-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ROLES (fixed set, matches RBAC screen)
CREATE TYPE user_role AS ENUM ('Fleet Manager', 'Dispatcher', 'Safety Officer', 'Financial Analyst');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  failed_login_attempts INT DEFAULT 0,
  locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- VEHICLES
CREATE TYPE vehicle_status AS ENUM ('Available', 'On Trip', 'In Shop', 'Retired');
CREATE TYPE vehicle_type AS ENUM ('Van', 'Truck', 'Mini');

CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_no VARCHAR(30) UNIQUE NOT NULL,
  name_model VARCHAR(120) NOT NULL,
  type vehicle_type NOT NULL,
  max_capacity_kg NUMERIC(10,2) NOT NULL,
  odometer NUMERIC(10,2) DEFAULT 0,
  acquisition_cost NUMERIC(12,2) NOT NULL,
  status vehicle_status NOT NULL DEFAULT 'Available',
  region VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- DRIVERS
CREATE TYPE driver_status AS ENUM ('Available', 'On Trip', 'Off Duty', 'Suspended');

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  license_no VARCHAR(50) UNIQUE NOT NULL,
  license_category VARCHAR(20) NOT NULL,
  license_expiry DATE NOT NULL,
  contact_no VARCHAR(20) NOT NULL,
  safety_score NUMERIC(5,2) DEFAULT 100,
  status driver_status NOT NULL DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- TRIPS
CREATE TYPE trip_status AS ENUM ('Draft', 'Dispatched', 'Completed', 'Cancelled');

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_code VARCHAR(20) UNIQUE NOT NULL,
  source VARCHAR(150) NOT NULL,
  destination VARCHAR(150) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id),
  driver_id UUID REFERENCES drivers(id),
  cargo_weight_kg NUMERIC(10,2) NOT NULL,
  planned_distance_km NUMERIC(10,2) NOT NULL,
  final_odometer NUMERIC(10,2),
  fuel_consumed_l NUMERIC(10,2),
  status trip_status NOT NULL DEFAULT 'Draft',
  eta VARCHAR(50),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- MAINTENANCE
CREATE TYPE maintenance_status AS ENUM ('active', 'Completed');

CREATE TABLE maintenance_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  service_date DATE NOT NULL,
  status maintenance_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- FUEL LOGS
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  liters NUMERIC(10,2) NOT NULL,
  cost NUMERIC(12,2) NOT NULL,
  log_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- EXPENSES (toll / misc)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID REFERENCES trips(id),
  vehicle_id UUID REFERENCES vehicles(id),
  toll NUMERIC(12,2) DEFAULT 0,
  other NUMERIC(12,2) DEFAULT 0,
  maintenance_linked NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) GENERATED ALWAYS AS (toll + other + maintenance_linked) STORED,
  status VARCHAR(20) DEFAULT 'Available',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Helpful indexes
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_trips_status ON trips(status);
