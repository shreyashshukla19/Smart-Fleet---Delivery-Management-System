import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface Vehicle {
  id: number;
  license_plate: string;
  model: string;
  status: string;
}

interface Driver {
  id: number;
  name: string;
  phone: string;
  license_number: string;
}

interface Delivery {
  id: number;
  item_name: string;
  destination: string;
  status: string;
  vehicle?: Vehicle;
  driver?: Driver;
}

interface VehicleLog {
  id: number;
  vehicle_id: number;
  log_type: string;
  cost: number;
  description: string;
  date: string;
  vehicle?: Vehicle;
}

const API_URL = 'http://127.0.0.1:8000';

export default function App() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [logs, setLogs] = useState<VehicleLog[]>([]);
  
  // Search & Filter states
  const [vehicleSearch, setVehicleSearch] = useState('');
  const [deliverySearch, setDeliverySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form states
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [vStatus, setVStatus] = useState('Active');

  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverLicense, setDriverLicense] = useState('');

  const [item, setItem] = useState('');
  const [destination, setDestination] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');

  // Log form states
  const [logVehicleId, setLogVehicleId] = useState('');
  const [logType, setLogType] = useState('Fuel');
  const [logCost, setLogCost] = useState('');
  const [logDesc, setLogDesc] = useState('');
  const [logDate, setLogDate] = useState('');

  const fetchData = async () => {
    try {
      const vRes = await fetch(`${API_URL}/vehicles/`);
      if (vRes.ok) setVehicles(await vRes.json());
    } catch (e) { console.error("Failed to fetch vehicles", e); }

    try {
      const dRes = await fetch(`${API_URL}/drivers/`);
      if (dRes.ok) setDrivers(await dRes.json());
    } catch (e) { console.error("Failed to fetch drivers", e); }

    try {
      const delRes = await fetch(`${API_URL}/deliveries/`);
      if (delRes.ok) setDeliveries(await delRes.json());
    } catch (e) { console.error("Failed to fetch deliveries", e); }

    try {
      const logRes = await fetch(`${API_URL}/logs/`);
      if (logRes.ok) setLogs(await logRes.json());
    } catch (e) { console.error("Failed to fetch logs", e); }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/vehicles/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_plate: plate, model, status: vStatus })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        alert(`Server Error Details: ${JSON.stringify(data)}`);
        return;
      }

      setPlate(''); 
      setModel('');
      fetchData();
    } catch (err) {
      console.error("Network Exception:", err);
      alert(`Network Error: ${err}`);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/drivers/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: driverName, phone: driverPhone, license_number: driverLicense })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${JSON.stringify(errData)}`);
        return;
      }
      setDriverName(''); setDriverPhone(''); setDriverLicense('');
      fetchData();
    } catch (err) {
      console.error("Failed to add driver:", err);
      alert("Could not connect to backend server.");
    }
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/deliveries/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item_name: item,
          destination,
          vehicle_id: selectedVehicleId ? Number(selectedVehicleId) : null,
          driver_id: selectedDriverId ? Number(selectedDriverId) : null
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${JSON.stringify(errData)}`);
        return;
      }
      setItem(''); setDestination(''); setSelectedVehicleId(''); setSelectedDriverId('');
      fetchData();
    } catch (err) {
      console.error("Failed to add delivery:", err);
      alert("Could not connect to backend server.");
    }
  };

  const handleCreateLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/logs/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicle_id: Number(logVehicleId),
          log_type: logType,
          cost: Number(logCost),
          description: logDesc,
          date: logDate
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        alert(`Error: ${JSON.stringify(errData)}`);
        return;
      }
      setLogVehicleId(''); setLogCost(''); setLogDesc(''); setLogDate('');
      fetchData();
    } catch (err) {
      console.error("Failed to add log:", err);
      alert("Could not connect to backend server.");
    }
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await fetch(`${API_URL}/deliveries/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredVehicles = vehicles.filter(v => 
    v.model.toLowerCase().includes(vehicleSearch.toLowerCase()) ||
    v.license_plate.toLowerCase().includes(vehicleSearch.toLowerCase())
  );

  const filteredDeliveries = deliveries.filter(d => {
    const matchesSearch = 
      d.item_name.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      d.destination.toLowerCase().includes(deliverySearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || d.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalExpenses = logs.reduce((acc, curr) => acc + Number(curr.cost || 0), 0);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', color: '#f8fafc', padding: '32px', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#34d399', margin: 0 }}>🚛 Smart Fleet & Delivery Hub</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0 0', fontSize: '14px' }}>Advanced Fleet, Driver, Map Tracking, & Maintenance Logs</p>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '8px 16px', borderRadius: '8px', border: '1px solid #475569', fontSize: '14px' }}>
          Backend Status: <span style={{ color: '#34d399', fontWeight: 'bold' }}>● Connected</span>
        </div>
      </header>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Total Vehicles</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#60a5fa', marginTop: '4px' }}>{vehicles.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Registered Drivers</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#a78bfa', marginTop: '4px' }}>{drivers.length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Pending Shipments</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f59e0b', marginTop: '4px' }}>{deliveries.filter(d => d.status === 'Pending').length}</div>
        </div>
        <div style={{ backgroundColor: '#1e293b', padding: '16px', borderRadius: '10px', border: '1px solid #334155' }}>
          <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase' }}>Fleet Expenses</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f87171', marginTop: '4px' }}>₹{totalExpenses.toLocaleString()}</div>
        </div>
      </div>

      {/* Live Map Tracker Section */}
      <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#38bdf8', marginTop: 0, marginBottom: '16px' }}>🗺️ Live Fleet & Route Tracking Map</h2>
        <div style={{ height: '350px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #475569' }}>
          <MapContainer center={[26.4499, 80.3319]} zoom={11} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={[26.4499, 80.3319]}>
              <Popup><b>Central Logistics Hub</b><br />Main Operational Headquarters</Popup>
            </Marker>
            {deliveries.map((d, index) => (
              <Marker key={d.id} position={[26.4499 + (index * 0.03), 80.3319 + (index * 0.04)]}>
                <Popup>
                  <b>{d.item_name}</b><br />Destination: {d.destination}<br />Status: {d.status}
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        {/* Vehicle Form */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#60a5fa', marginTop: 0 }}>🚗 Register Vehicle</h2>
          <form onSubmit={handleCreateVehicle} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={plate} onChange={e => setPlate(e.target.value)} required placeholder="License Plate" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="text" value={model} onChange={e => setModel(e.target.value)} required placeholder="Vehicle Model" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <select value={vStatus} onChange={e => setVStatus(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
            </select>
            <button type="submit" style={{ backgroundColor: '#2563eb', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Vehicle</button>
          </form>
        </div>

        {/* Driver Form */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#a78bfa', marginTop: 0 }}>👨‍✈️ Register Driver</h2>
          <form onSubmit={handleCreateDriver} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={driverName} onChange={e => setDriverName(e.target.value)} required placeholder="Driver Name" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="text" value={driverPhone} onChange={e => setDriverPhone(e.target.value)} required placeholder="Phone Number" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="text" value={driverLicense} onChange={e => setDriverLicense(e.target.value)} required placeholder="License Number" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <button type="submit" style={{ backgroundColor: '#7c3aed', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Driver</button>
          </form>
        </div>

        {/* Delivery Form */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#34d399', marginTop: 0 }}>📦 Schedule Delivery</h2>
          <form onSubmit={handleCreateDelivery} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" value={item} onChange={e => setItem(e.target.value)} required placeholder="Cargo Name" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="text" value={destination} onChange={e => setDestination(e.target.value)} required placeholder="Destination Hub" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <select value={selectedVehicleId} onChange={e => setSelectedVehicleId(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">-- Assign Vehicle --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>)}
            </select>
            <select value={selectedDriverId} onChange={e => setSelectedDriverId(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">-- Assign Driver --</option>
              {drivers.map(drv => <option key={drv.id} value={drv.id}>{drv.name}</option>)}
            </select>
            <button type="submit" style={{ backgroundColor: '#059669', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Create Delivery</button>
          </form>
        </div>

        {/* Maintenance / Fuel Form */}
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h2 style={{ fontSize: '16px', fontWeight: '600', color: '#f87171', marginTop: 0 }}>⛽ Maintenance & Fuel Log</h2>
          <form onSubmit={handleCreateLog} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select value={logVehicleId} onChange={e => setLogVehicleId(e.target.value)} required style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="">-- Select Vehicle --</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model} ({v.license_plate})</option>)}
            </select>
            <select value={logType} onChange={e => setLogType(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }}>
              <option value="Fuel">Fuel Refill</option>
              <option value="Maintenance">Maintenance / Repair</option>
            </select>
            <input type="number" value={logCost} onChange={e => setLogCost(e.target.value)} required placeholder="Cost (₹)" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="text" value={logDesc} onChange={e => setLogDesc(e.target.value)} required placeholder="Description (e.g. 40L Diesel / Oil change)" style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <input type="date" value={logDate} onChange={e => setLogDate(e.target.value)} required style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px' }} />
            <button type="submit" style={{ backgroundColor: '#dc2626', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' }}>Add Expense Log</button>
          </form>
        </div>
      </div>

      {/* Lists Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
        {/* Vehicles List */}
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#60a5fa', marginTop: 0 }}>🚗 Fleet Vehicles ({filteredVehicles.length})</h3>
          <input type="text" value={vehicleSearch} onChange={e => setVehicleSearch(e.target.value)} placeholder="🔍 Search vehicles..." style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredVehicles.map(v => (
              <div key={v.id} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{v.model}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{v.license_plate}</div>
                </div>
                <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: '#064e3b', color: '#6ee7b7' }}>{v.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Deliveries List */}
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#34d399', margin: 0 }}>📦 Active Shipments ({filteredDeliveries.length})</h3>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '4px', borderRadius: '6px', fontSize: '12px' }}>
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Transit">In Transit</option>
              <option value="Delivered">Delivered</option>
            </select>
          </div>
          <input type="text" value={deliverySearch} onChange={e => setDeliverySearch(e.target.value)} placeholder="🔍 Search shipments..." style={{ width: '100%', backgroundColor: '#0f172a', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '6px', marginBottom: '12px', boxSizing: 'border-box' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredDeliveries.map(d => (
              <div key={d.id} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>{d.item_name}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>📍 {d.destination}</div>
                  </div>
                  <span style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '12px', backgroundColor: '#1e3a8a', color: '#93c5fd', fontWeight: '600' }}>{d.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => handleUpdateStatus(d.id, 'Pending')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: 'none', backgroundColor: d.status === 'Pending' ? '#b45309' : '#334155', color: '#fff' }}>Pending</button>
                  <button onClick={() => handleUpdateStatus(d.id, 'In Transit')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: 'none', backgroundColor: d.status === 'In Transit' ? '#1d4ed8' : '#334155', color: '#fff' }}>In Transit</button>
                  <button onClick={() => handleUpdateStatus(d.id, 'Delivered')} style={{ fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: 'none', backgroundColor: d.status === 'Delivered' ? '#047857' : '#334155', color: '#fff' }}>Delivered</button>
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', borderTop: '1px solid #1e293b', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <div>Vehicle: <span style={{ color: '#cbd5e1' }}>{d.vehicle ? `${d.vehicle.model} (${d.vehicle.license_plate})` : '⚠️ Unassigned'}</span></div>
                  <div>Driver: <span style={{ color: '#a78bfa' }}>{d.driver ? `${d.driver.name} (${d.driver.phone})` : '⚠️ Unassigned'}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expense & Maintenance Logs List */}
        <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#f87171', marginTop: 0 }}>🛠️ Maintenance & Fuel History ({logs.length})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {logs.map(l => (
              <div key={l.id} style={{ backgroundColor: '#0f172a', padding: '12px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{l.description}</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Type: <span style={{ color: l.log_type === 'Fuel' ? '#38bdf8' : '#f59e0b' }}>{l.log_type}</span> | Date: {l.date}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#f87171' }}>₹{l.cost}</div>
                </div>
              </div>
            ))}
            {logs.length === 0 && <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px' }}>No expense logs recorded yet.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}