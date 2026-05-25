// controllers/tasks.controller.js
import mongoose from 'mongoose';
import Task from '../models/Task.js';

/**
 * Lấy tất cả task
 * - Sort theo createdAt mới nhất
 * - .lean() để trả về plain object -> nhanh, nhẹ (không cần instance Mongoose)
 */
export const getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find().sort({ createdAt: -1 }).lean();
        // Giữ nguyên format trả về như bạn đang dùng: mảng task
        return res.status(200).json(tasks);
    } catch (error) {
        console.error('Lỗi khi gọi getAllTasks', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

/**
 * Tạo task mới
 * - Validate tối thiểu: title bắt buộc, non-empty
 * - Bắt lỗi validate của Mongoose trả 422 (Unprocessable Entity)
 */
export const createTask = async (req, res) => {
    try {
        const { title, description, status, priority, dueDate } = req.body;

        // Validate thô: nếu dùng Joi/Zod thì chuyển qua schema validator
        if (!title || !String(title).trim()) {
            return res.status(422).json({ message: 'title là bắt buộc' });
        }

        const task = new Task({
            title: String(title).trim(),
            description,
            status,     // nếu model có enum thì Mongoose sẽ validate giúp
            priority,
            dueDate
        });

        const newTask = await task.save(); // chạy validate schema
        return res.status(201).json(newTask);
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(422).json({ message: error.message });
        }
        console.error('Lỗi khi gọi createTask', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

/**
 * Cập nhật task theo ID
 * - Validate ObjectId
 * - Chỉ cập nhật các field được phép (tránh overposting/mass-assignment)
 * - Dùng runValidators để bật validate khi update
 * - Rule nhỏ: nếu status = "done" mà chưa có completedAt thì tự set
 */
export const updateTask = async (req, res) => {
    try {
        const { id } = req.params;

        // 1) Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        // 2) Chỉ nhận những field cho phép; bỏ qua field undefined để không ghi đè bằng undefined
        const allow = ['title', 'description', 'status', 'priority', 'dueDate', 'completedAt'];
        const payload = {};
        for (const k of allow) {
            if (k in req.body && req.body[k] !== undefined) payload[k] = req.body[k];
        }

        // 3) Business rule nhỏ
        if (payload.status === 'done' && !payload.completedAt) {
            payload.completedAt = new Date();
        }

        // 4) Update có validate + trả về document mới nhất
        const updatedTask = await Task.findByIdAndUpdate(id, payload, {
            new: true,
            runValidators: true // bắt buộc nếu muốn schema validate khi update
        });

        if (!updatedTask) {
            return res.status(404).json({ error: 'Nhiệm vụ không tồn tại' });
        }

        return res.status(200).json(updatedTask); // giữ nguyên format bạn đang dùng
    } catch (error) {
        if (error.name === 'ValidationError') {
            return res.status(422).json({ message: error.message });
        }
        console.error('Lỗi khi gọi updateTask', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};

/**
 * Xóa task theo ID
 * - Validate ObjectId
 * - Nếu không tìm thấy trả 404
 */
export const deleteTask = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra ID hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID không hợp lệ' });
        }

        const deletedTask = await Task.findByIdAndDelete(id);

        if (!deletedTask) {
            return res.status(404).json({ error: 'Nhiệm vụ không tồn tại' });
        }

        return res.status(200).json(deletedTask); // giữ nguyên format
    } catch (error) {
        console.error('Lỗi khi gọi deleteTask', error);
        return res.status(500).json({ message: 'Lỗi hệ thống' });
    }
};