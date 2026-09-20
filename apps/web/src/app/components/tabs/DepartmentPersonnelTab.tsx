import { useState } from 'react';
import { User, Plus, Edit, Trash2, Search, Mail, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface Employee {
  id: string;
  name: string;
  email: string;
  position: string;
  phone: string;
  department: string;
  status: 'Active' | 'On Leave' | 'Inactive';
  dateHired: string;
}

interface DepartmentPersonnelTabProps {
  departmentFilter?: string;
}

export function DepartmentPersonnelTab({ departmentFilter }: DepartmentPersonnelTabProps) {
  const { user } = useAuth();
  const currentDepartment = departmentFilter || user?.department || '';

  const allEmployees: Employee[] = [
    // Admin
    { id: '1', name: 'Engr. Maria Santos', email: 'maria.santos@rizal.gov', position: 'MENRO Officer-in-Charge', phone: '0917-123-4567', department: 'admin', status: 'Active', dateHired: '2020-01-15' },
    { id: '2', name: 'Carlos R. Mendez', email: 'carlos.mendez@rizal.gov', position: 'Administrative Assistant', phone: '0918-234-5678', department: 'admin', status: 'Active', dateHired: '2021-03-10' },

    // Nursery
    { id: '3', name: 'Roberto C. Mendoza', email: 'roberto.mendoza@rizal.gov', position: 'Nursery Supervisor', phone: '0919-345-6789', department: 'nursery', status: 'Active', dateHired: '2019-05-20' },
    { id: '4', name: 'Ana Marie L. Cruz', email: 'anamarie.cruz@rizal.gov', position: 'Nursery Technician', phone: '0920-456-7890', department: 'nursery', status: 'Active', dateHired: '2021-07-15' },
    { id: '5', name: 'Pedro B. Santos', email: 'pedro.santos@rizal.gov', position: 'Seedling Caretaker', phone: '0921-567-8901', department: 'nursery', status: 'Active', dateHired: '2022-02-01' },

    // Environmental
    { id: '6', name: 'Dr. Elena V. Reyes', email: 'elena.reyes@rizal.gov', position: 'Environmental Specialist', phone: '0922-678-9012', department: 'environmental', status: 'Active', dateHired: '2018-09-12' },
    { id: '7', name: 'Michael T. Garcia', email: 'michael.garcia@rizal.gov', position: 'Wildlife Biologist', phone: '0923-789-0123', department: 'environmental', status: 'Active', dateHired: '2020-11-05' },

    // Solid Waste
    { id: '8', name: 'Carlos P. Fernandez', email: 'carlos.fernandez@rizal.gov', position: 'Solid Waste Coordinator', phone: '0924-890-1234', department: 'solid-waste', status: 'Active', dateHired: '2019-03-08' },
    { id: '9', name: 'Ramon A. Lopez', email: 'ramon.lopez@rizal.gov', position: 'Collection Driver', phone: '0925-901-2345', department: 'solid-waste', status: 'Active', dateHired: '2020-06-20' },
    { id: '10', name: 'Jose M. Rivera', email: 'jose.rivera@rizal.gov', position: 'Collection Driver', phone: '0926-012-3456', department: 'solid-waste', status: 'Active', dateHired: '2021-01-10' },

    // Landfill
    { id: '11', name: 'Juan M. Dela Cruz', email: 'juan.delacruz@rizal.gov', position: 'Landfill Operations Head', phone: '0927-123-4567', department: 'landfill', status: 'Active', dateHired: '2018-04-15' },
    { id: '12', name: 'Ricardo P. Torres', email: 'ricardo.torres@rizal.gov', position: 'Landfill Operator', phone: '0928-234-5678', department: 'landfill', status: 'Active', dateHired: '2020-08-22' },

    // Enforcement
    { id: '15', name: 'Francisco R. Valdez', email: 'francisco.valdez@rizal.gov', position: 'Enforcement Team Leader', phone: '0931-567-8901', department: 'enforcement', status: 'Active', dateHired: '2017-12-01' },
    { id: '16', name: 'Antonio L. Morales', email: 'antonio.morales@rizal.gov', position: 'Forest Ranger', phone: '0932-678-9012', department: 'enforcement', status: 'Active', dateHired: '2019-07-30' },
  ];

  const [employees, setEmployees] = useState<Employee[]>(allEmployees);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    position: '',
    phone: '',
    department: currentDepartment,
    status: 'Active' as Employee['status'],
    dateHired: ''
  });

  // Filter employees by department
  const departmentEmployees = employees.filter(emp => emp.department === currentDepartment);

  const filteredEmployees = departmentEmployees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setEmployees(employees.map(emp =>
        emp.id === editingId ? { ...formData, id: editingId, department: currentDepartment } : emp
      ));
    } else {
      setEmployees([...employees, { ...formData, id: Date.now().toString(), department: currentDepartment }]);
    }
    resetForm();
  };

  const handleEdit = (employee: Employee) => {
    setFormData(employee);
    setEditingId(employee.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this employee?')) {
      setEmployees(employees.filter(emp => emp.id !== id));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      position: '',
      phone: '',
      department: currentDepartment,
      status: 'Active',
      dateHired: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getDepartmentName = () => {
    const deptNames: { [key: string]: string } = {
      'admin': 'Administration',
      'nursery': 'Nursery',
      'environmental': 'Environmental Management',
      'solid-waste': 'Solid Waste Management',
      'landfill': 'Landfill Management',
      'enforcement': 'Enforcement'
    };
    return deptNames[currentDepartment] || currentDepartment;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">{getDepartmentName()} Personnel</h2>
        <p className="text-gray-600 mt-1">Manage {getDepartmentName()} department staff</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <p className="text-sm text-green-600 mb-1">Total Staff</p>
          <p className="text-3xl font-bold text-green-800">{departmentEmployees.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <p className="text-sm text-blue-600 mb-1">Active</p>
          <p className="text-3xl font-bold text-blue-800">{departmentEmployees.filter(e => e.status === 'Active').length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
          <p className="text-sm text-yellow-600 mb-1">On Leave</p>
          <p className="text-3xl font-bold text-yellow-800">{departmentEmployees.filter(e => e.status === 'On Leave').length}</p>
        </div>
      </div>

      {/* Search and Add */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search personnel by name, email, or position..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Employee
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <User className="w-5 h-5" />
            {editingId ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Position</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date Hired</label>
                <input
                  type="date"
                  value={formData.dateHired}
                  onChange={(e) => setFormData({ ...formData, dateHired: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Employee['status'] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                {editingId ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Name</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Position</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Contact</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date Hired</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
              <tr key={employee.id} className="border-t border-gray-200 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-800">{employee.name}</td>
                <td className="py-3 px-4 text-gray-600">{employee.position}</td>
                <td className="py-3 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {employee.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      {employee.phone}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 text-gray-600">{employee.dateHired}</td>
                <td className="py-3 px-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    employee.status === 'Active' ? 'bg-green-100 text-green-700' :
                    employee.status === 'On Leave' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {employee.status}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No personnel found</p>
          </div>
        )}
      </div>
    </div>
  );
}
