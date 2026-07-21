import { sql } from "~/db";

async function seed() {
  const db = sql();

  console.log("Seeding data...");

  // Check if already seeded
  const existing = await db`SELECT COUNT(*)::int AS count FROM cleaners`;
  if (existing[0].count > 0) {
    console.log("Data already seeded, skipping.");
    process.exit(0);
  }

  // Create cleaners
  const cleaners = await db`
    INSERT INTO cleaners (name, phone, email, reliability_score, points_balance) VALUES
      ('Maria Garcia', '555-0101', 'maria@example.com', 95, 120),
      ('James Wilson', '555-0102', 'james@example.com', 88, 85),
      ('Sarah Chen', '555-0103', 'sarah@example.com', 92, 110),
      ('David Martinez', '555-0104', 'david@example.com', 78, 45),
      ('Emily Johnson', '555-0105', 'emily@example.com', 60, 20),
      ('Michael Brown', '555-0106', 'michael@example.com', 45, 5)
    RETURNING id, name
  `;
  console.log(`  ✓ ${cleaners.length} cleaners created`);

  // Create owner settings
  await db`
    INSERT INTO owner_settings (business_name, owner_email, points_per_on_time, points_per_backup, penalty_for_no_show)
    VALUES ('Sparkle Clean Co.', 'owner@sparkleclean.com', 10, 25, -50)
  `;
  console.log(`  ✓ Owner settings created`);

  // Create jobs for today and upcoming
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const dayAfter = new Date(Date.now() + 172800000).toISOString().split('T')[0];

  const [maria, james, sarah, david, emily] = cleaners;

  // Today's jobs
  await db`
    INSERT INTO jobs (title, scheduled_date, scheduled_time, location, assigned_cleaner_id, status, notes) VALUES
      ('Office Clean - Downtown', ${today}, '09:00', '123 Main St, Suite 400', ${maria.id}, 'confirmed', 'Deep clean, focus on windows'),
      ('Residential - Johnson', ${today}, '10:00', '456 Oak Ave', ${james.id}, 'pending', '3BR/2BA, bring own supplies'),
      ('Move-out Clean', ${today}, '13:00', '789 Pine Rd', ${sarah.id}, 'confirmed', 'Full move-out, carpet steam'),
      ('Office Clean - Westside', ${today}, '14:00', '321 Elm Blvd', ${david.id}, 'pending', 'Standard weekly clean'),
      ('Post-Construction', ${today}, '08:00', '555 Cedar Ln', ${emily.id}, 'pending', 'New construction, dust everywhere')
  `;
  console.log(`  ✓ Today's jobs created`);

  // Create attendance records for confirmed jobs
  await db`
    INSERT INTO attendance_logs (job_id, cleaner_id, confirmed, confirmed_at, status)
    SELECT id, assigned_cleaner_id, true, now(), 'ontime'
    FROM jobs WHERE status = 'confirmed' AND scheduled_date = ${today}
  `;
  console.log(`  ✓ Attendance records created`);

  // Upcoming jobs
  await db`
    INSERT INTO jobs (title, scheduled_date, scheduled_time, location, assigned_cleaner_id, status) VALUES
      ('Residential - Thompson', ${tomorrow}, '09:00', '777 Maple Dr', ${maria.id}, 'pending'),
      ('Office Clean - Eastside', ${tomorrow}, '10:00', '888 Birch Ct', ${sarah.id}, 'pending'),
      ('Airbnb Turnover', ${tomorrow}, '12:00', '999 Walnut Way', ${james.id}, 'pending'),
      ('Deep Clean - Martinez', ${dayAfter}, '09:00', '111 Spruce St', ${maria.id}, 'pending'),
      ('Window Cleaning', ${dayAfter}, '10:00', '222 Cherry Ave', ${david.id}, 'pending'),
      ('Carpet Cleaning', ${dayAfter}, '13:00', '333 Ash Blvd', ${sarah.id}, 'pending')
  `;
  console.log(`  ✓ Upcoming jobs created`);

  // Create some points transactions
  await db`
    INSERT INTO points_transactions (cleaner_id, points, reason, reference_job_id)
    SELECT c.id, 10, 'on_time', j.id
    FROM cleaners c
    JOIN jobs j ON j.assigned_cleaner_id = c.id
    WHERE j.status = 'confirmed' AND j.scheduled_date = ${today}
  `;
  console.log(`  ✓ Points transactions created`);

  console.log("\n✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});