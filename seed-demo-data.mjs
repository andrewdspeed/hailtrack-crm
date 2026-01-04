import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);

// Clear existing demo data
await connection.query('DELETE FROM leads WHERE agent_name = "Demo Agent" OR agent_name = "Sales Agent"');

// Insert demo leads
const demoLeads = [
  {
    address: '123 Main St, Denver, CO 80202',
    name: 'John Smith',
    phone: '303-555-0101',
    email: 'john@example.com',
    city: 'Denver',
    state: 'CO',
    status: 'lead',
    agent_id: 1,
    agent_name: 'Demo Agent',
    agent_phone: '303-555-0100',
    agent_email: 'agent@hail-solutions.com',
    notes: 'Demo lead - Large hail damage on roof',
    latitude: '39.7392',
    longitude: '-104.9903',
  },
  {
    address: '456 Oak Ave, Boulder, CO 80301',
    name: 'Sarah Johnson',
    phone: '303-555-0102',
    email: 'sarah@example.com',
    city: 'Boulder',
    state: 'CO',
    status: 'scheduled',
    agent_id: 1,
    agent_name: 'Demo Agent',
    agent_phone: '303-555-0100',
    agent_email: 'agent@hail-solutions.com',
    notes: 'Demo lead - Scheduled for inspection',
    latitude: '40.0150',
    longitude: '-105.2705',
  },
  {
    address: '789 Pine Rd, Aurora, CO 80010',
    name: 'Mike Davis',
    phone: '303-555-0103',
    email: 'mike@example.com',
    city: 'Aurora',
    state: 'CO',
    status: 'in_shop',
    agent_id: 1,
    agent_name: 'Demo Agent',
    agent_phone: '303-555-0100',
    agent_email: 'agent@hail-solutions.com',
    notes: 'Demo lead - Vehicle in repair shop',
    latitude: '39.7294',
    longitude: '-104.8202',
  },
  {
    address: '321 Elm St, Littleton, CO 80120',
    name: 'Jennifer Brown',
    phone: '303-555-0104',
    email: 'jen@example.com',
    city: 'Littleton',
    state: 'CO',
    status: 'awaiting_pickup',
    agent_id: 1,
    agent_name: 'Demo Agent',
    agent_phone: '303-555-0100',
    agent_email: 'agent@hail-solutions.com',
    notes: 'Demo lead - Waiting for customer pickup',
    latitude: '39.6119',
    longitude: '-104.9847',
  },
  {
    address: '654 Maple Dr, Westminster, CO 80031',
    name: 'Robert Wilson',
    phone: '303-555-0105',
    email: 'robert@example.com',
    city: 'Westminster',
    state: 'CO',
    status: 'complete',
    agent_id: 1,
    agent_name: 'Demo Agent',
    agent_phone: '303-555-0100',
    agent_email: 'agent@hail-solutions.com',
    notes: 'Demo lead - Repair completed',
    latitude: '39.8368',
    longitude: '-104.9900',
  },
];

for (const lead of demoLeads) {
  await connection.query(
    'INSERT INTO leads (address, name, phone, email, city, state, status, agent_id, agent_name, agent_phone, agent_email, notes, latitude, longitude, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [
      lead.address,
      lead.name,
      lead.phone,
      lead.email,
      lead.city,
      lead.state,
      lead.status,
      lead.agent_id,
      lead.agent_name,
      lead.agent_phone,
      lead.agent_email,
      lead.notes,
      lead.latitude,
      lead.longitude,
    ]
  );
}

console.log('Demo data seeded successfully!');
await connection.end();
