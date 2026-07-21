-- Migration 002: Seed sample data for development
-- Add sample cleaners, jobs, attendance, and points for testing

-- Sample cleaners
INSERT INTO cleaners (id, name, phone, email, reliability_score, points_balance) VALUES
    ('c0010000-0000-0000-0000-000000000001', 'Maria Garcia', '555-0101', 'maria@example.com', 95, 320),
    ('c0010000-0000-0000-0000-000000000002', 'James Wilson', '555-0102', 'james@example.com', 88, 245),
    ('c0010000-0000-0000-0000-000000000003', 'Lisa Chen', '555-0103', 'lisa@example.com', 92, 290),
    ('c0010000-0000-0000-0000-000000000004', 'David Brown', '555-0104', 'david@example.com', 75, 110),
    ('c0010000-0000-0000-0000-000000000005', 'Sarah Johnson', '555-0105', 'sarah@example.com', 98, 410),
    ('c0010000-0000-0000-0000-000000000006', 'Mike Torres', '555-0106', 'mike@example.com', 82, 180),
    ('c0010000-0000-0000-0000-000000000007', 'Emily Davis', '555-0107', 'emily@example.com', 60, 45),
    ('c0010000-0000-0000-0000-000000000008', 'Carlos Ruiz', '555-0108', 'carlos@example.com', 91, 275);

-- Sample jobs (today, upcoming, and past)
INSERT INTO jobs (id, title, description, scheduled_date, scheduled_time, location, assigned_cleaner_id, status, notes) VALUES
    ('j0010000-0000-0000-0000-000000000001', 'Office Building A - Floor 3', 'Weekly deep clean of offices and break room',
     CURRENT_DATE, '08:00', '123 Business Park Dr, Suite 300', 'c0010000-0000-0000-0000-000000000001', 'confirmed', 'Bring floor buffer'),
    ('j0010000-0000-0000-0000-000000000002', 'Residential - Johnson Home', 'Standard clean, 3BR 2BA',
     CURRENT_DATE, '10:00', '456 Oak Ave', 'c0010000-0000-0000-0000-000000000002', 'pending', 'Key under mat'),
    ('j0010000-0000-0000-0000-000000000003', 'Dental Office Cleaning', 'Medical-grade sanitization required',
     CURRENT_DATE, '14:00', '789 Medical Plaza, Suite 100', 'c0010000-0000-0000-0000-000000000003', 'confirmed', 'Use hospital-grade disinfectant'),
    ('j0010000-0000-0000-0000-000000000004', 'Retail Store - Evening', 'Floor mopping, window cleaning, restroom',
     CURRENT_DATE, '18:00', '321 Main St', 'c0010000-0000-0000-0000-000000000005', 'in_progress', 'Alarm code: 4321'),
    ('j0010000-0000-0000-0000-000000000005', 'Apartment Move-out Clean', 'Full deep clean for move-out inspection',
     CURRENT_DATE + INTERVAL '1 day', '09:00', '567 Pine St, Apt 4B', 'c0010000-0000-0000-0000-000000000004', 'pending', 'Landlord will meet you'),
    ('j0010000-0000-0000-0000-000000000006', 'Office Building B - Full', 'All 5 floors, common areas',
     CURRENT_DATE + INTERVAL '1 day', '07:00', '890 Corporate Blvd', 'c0010000-0000-0000-0000-000000000006', 'pending', 'Access card at front desk'),
    ('j0010000-0000-0000-0000-000000000007', 'Restaurant Kitchen Deep Clean', 'Hood, floors, equipment',
     CURRENT_DATE + INTERVAL '2 days', '22:00', '42 Foodie Lane', 'c0010000-0000-0000-0000-000000000008', 'pending', 'After closing, use back entrance'),
    ('j0010000-0000-0000-0000-000000000008', 'Past Job - Smith Residence', 'Standard clean, 2BR 1BA',
     CURRENT_DATE - INTERVAL '1 day', '10:00', '111 Elm St', 'c0010000-0000-0000-0000-000000000001', 'completed', 'Completed on time'),
    ('j0010000-0000-0000-0000-000000000009', 'Past Job - Gym Facility', 'Locker rooms, equipment wipe-down',
     CURRENT_DATE - INTERVAL '2 days', '05:00', '222 Fitness Way', 'c0010000-0000-0000-0000-000000000003', 'completed', 'Early morning shift'),
    ('j0010000-0000-0000-0000-000000000010', 'Past No-Show - Warehouse', 'Floor scrubbing, office area',
     CURRENT_DATE - INTERVAL '3 days', '08:00', '333 Industrial Pkwy', 'c0010000-0000-0000-0000-000000000007', 'no_show', 'Cleaner did not show, backup deployed');

-- Sample attendance logs
INSERT INTO attendance_logs (job_id, cleaner_id, confirmed, confirmed_at, status) VALUES
    ('j0010000-0000-0000-0000-000000000001', 'c0010000-0000-0000-0000-000000000001', true, CURRENT_DATE - INTERVAL '1 hour', null),
    ('j0010000-0000-0000-0000-000000000003', 'c0010000-0000-0000-0000-000000000003', true, CURRENT_DATE - INTERVAL '2 hours', null),
    ('j0010000-0000-0000-0000-000000000008', 'c0010000-0000-0000-0000-000000000001', true, CURRENT_DATE - INTERVAL '1 day', 'ontime'),
    ('j0010000-0000-0000-0000-000000000009', 'c0010000-0000-0000-0000-000000000003', true, CURRENT_DATE - INTERVAL '2 days', 'ontime'),
    ('j0010000-0000-0000-0000-000000000010', 'c0010000-0000-0000-0000-000000000007', false, null, 'no_show');

-- Sample points transactions
INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id) VALUES
    ('c0010000-0000-0000-0000-000000000001', 10, 'on_time', 'j0010000-0000-0000-0000-000000000008'),
    ('c0010000-0000-0000-0000-000000000001', 25, 'backup_shift', 'j0010000-0000-0000-0000-000000000010'),
    ('c0010000-0000-0000-0000-000000000003', 10, 'on_time', 'j0010000-0000-0000-0000-000000000009'),
    ('c0010000-0000-0000-0000-000000000005', 10, 'on_time', 'j0010000-0000-0000-0000-000000000008'),
    ('c0010000-0000-0000-0000-000000000007', -50, 'no_show', 'j0010000-0000-0000-0000-000000000010');
