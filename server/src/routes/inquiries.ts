import { Router } from 'express';



import { generateId, nextTicketNumber, query, queryOne } from '../db.js';



import { authMiddleware, staffOnly } from '../middleware/auth.js';



import { logHistory } from '../lib/history.js';



import {

  getDepartmentAssignedLabel,

  getDepartmentName,

  staffDepartmentToId,

} from '../lib/departments.js';



import { isMainAdminDepartment } from '../lib/sections.js';







const router = Router();







async function getStaffName(userId: string) {



  const staff = await queryOne<{ name: string }>('SELECT name FROM staff_users WHERE id = $1', [userId]);



  return staff?.name || 'Staff';



}







function formatDateSubmitted() {



  return new Date().toLocaleString('en-US', {



    year: 'numeric', month: '2-digit', day: '2-digit',



    hour: '2-digit', minute: '2-digit', hour12: true,



  });



}







router.get('/', authMiddleware, async (req, res) => {



  try {



    const { status, category } = req.query;



    let sql = 'SELECT * FROM inquiries WHERE 1=1';



    const params: unknown[] = [];



    let paramIndex = 1;







    if (req.user?.type === 'citizen') {



      sql += ` AND email = $${paramIndex++}`;



      params.push(req.user.email);



    } else if (req.user?.type === 'staff' && !isMainAdminDepartment(req.user.department, req.user.staff_role)) {



      const deptId = staffDepartmentToId(req.user.department || '');



      const deptLabel = getDepartmentAssignedLabel(req.user.department || '');



      if (deptId) {



        sql += ` AND (department_id = $${paramIndex} OR (department_id IS NULL AND assigned_to = $${paramIndex + 1}))`;



        params.push(deptId, deptLabel);



        paramIndex += 2;



      }



    }







    if (status && status !== 'all') {



      sql += ` AND status = $${paramIndex++}`;



      params.push(status);



    }



    if (category && category !== 'all') {



      sql += ` AND category = $${paramIndex++}`;



      params.push(category);



    }







    sql += ' ORDER BY date_submitted DESC';



    const inquiries = await query(sql, params);



    res.json(inquiries);



  } catch (err) {



    console.error(err);



    res.status(500).json({ error: 'Internal server error' });



  }



});







router.post('/', authMiddleware, async (req, res) => {



  try {



    const { name, email, phone, category, subject, message, priority, department_id, service_id } = req.body;



    if (!subject || !message) {



      return res.status(400).json({ error: 'Subject and message are required' });



    }







    let citizenName = name;



    let citizenEmail = email;



    let citizenPhone = phone;



    let citizenId: string | null = null;







    if (req.user?.type === 'citizen') {



      const citizen = await queryOne<{ id: string; name: string; email: string; phone: string }>(



        'SELECT * FROM citizens WHERE id = $1', [req.user.id]



      );



      if (!citizen) return res.status(404).json({ error: 'Citizen not found' });



      citizenName = citizen.name;



      citizenEmail = citizen.email;



      citizenPhone = citizen.phone;



      citizenId = citizen.id;



    } else if (!name || !email) {



      return res.status(400).json({ error: 'Name and email are required' });



    }







    let resolvedDepartmentId = department_id as string | undefined;



    let resolvedCategory = category as string | undefined;



    let resolvedSubject = subject as string;







    if (service_id) {



      const service = await queryOne<{



        department_id: string;



        service_name: string;



        status: string;



        department_name: string;



      }>(



        `SELECT ds.department_id, ds.service_name, ds.status, d.name AS department_name



         FROM department_services ds



         JOIN departments d ON d.id = ds.department_id



         WHERE ds.id = $1`,



        [service_id]



      );



      if (!service) return res.status(404).json({ error: 'Service not found' });



      if (service.status !== 'Active') {



        return res.status(400).json({ error: 'Selected service is not currently available' });



      }



      resolvedDepartmentId = service.department_id;



      resolvedCategory = service.department_name;



      resolvedSubject = subject || service.service_name;



    } else if (resolvedDepartmentId) {



      resolvedCategory = resolvedCategory || getDepartmentName(resolvedDepartmentId);



      resolvedSubject = subject;



    }







    if (!resolvedDepartmentId && !resolvedCategory) {



      return res.status(400).json({ error: 'Department or service is required' });



    }







    const assignedTo = resolvedDepartmentId



      ? getDepartmentAssignedLabel(resolvedDepartmentId)



      : getDepartmentAssignedLabel('admin');







    const id = generateId();



    const ticketNumber = await nextTicketNumber();







    await query(



      `INSERT INTO inquiries (



        id, ticket_number, citizen_id, name, email, phone, category, subject, message,



        priority, status, assigned_to, department_id, service_id, date_submitted, updated_at



      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Pending', $11, $12, $13, $14, NOW())`,



      [



        id,



        ticketNumber,



        citizenId,



        citizenName,



        citizenEmail,



        citizenPhone || '',



        resolvedCategory || getDepartmentName(resolvedDepartmentId || 'admin'),



        resolvedSubject,



        message,



        priority || 'Normal',



        assignedTo,



        resolvedDepartmentId || null,



        service_id || null,



        formatDateSubmitted(),



      ]



    );







    const inquiry = await queryOne('SELECT * FROM inquiries WHERE id = $1', [id]);



    res.status(201).json(inquiry);



  } catch (err) {



    console.error(err);



    res.status(500).json({ error: 'Internal server error' });



  }



});







router.patch('/:id', authMiddleware, staffOnly, async (req, res) => {



  try {



    const { status, response } = req.body;



    const inquiry = await queryOne<{ department_id: string; assigned_to: string; ticket_number: string; category: string; subject: string }>(



      'SELECT department_id, assigned_to, ticket_number, category, subject FROM inquiries WHERE id = $1',



      [req.params.id]



    );



    if (!inquiry) return res.status(404).json({ error: 'Inquiry not found' });







    if (!isMainAdminDepartment(req.user?.department, req.user?.staff_role)) {



      const deptId = staffDepartmentToId(req.user?.department || '');



      const deptLabel = getDepartmentAssignedLabel(req.user?.department || '');



      const canAccess =

        (deptId && inquiry.department_id === deptId) ||

        (!inquiry.department_id && inquiry.assigned_to === deptLabel);



      if (!canAccess) {



        return res.status(403).json({ error: 'You can only update inquiries for your department' });



      }



    }







    if (status) {



      await query('UPDATE inquiries SET status = $1, updated_at = NOW() WHERE id = $2', [status, req.params.id]);



    }



    if (response !== undefined) {



      await query('UPDATE inquiries SET response = $1, updated_at = NOW() WHERE id = $2', [response, req.params.id]);



    }







    const updated = await queryOne('SELECT * FROM inquiries WHERE id = $1', [req.params.id]);



    const staffName = await getStaffName(req.user!.id);



    await logHistory({



      title: `Inquiry ${status ? 'status updated' : 'response sent'}: ${inquiry.ticket_number}`,



      description: response || `Status changed to ${status || updated?.status}`,



      activity_type: 'Inquiry Response',



      section: inquiry.department_id || 'admin',



      status: String(updated?.status),



      performed_by: staffName,



    });



    res.json(updated);



  } catch (err) {



    console.error(err);



    res.status(500).json({ error: 'Internal server error' });



  }



});







export default router;


