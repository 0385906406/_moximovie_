import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true, // thuộc tính bắt buộc phải có hay không.
            trim: true      // có khoảng trắng thừa ở đầu hoặc cuối thì có xóa đi hay không.
        },
        status: {
            type: String,
            enum: ["active", "complete"],
            default: "active"
        },
        completedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true, // createdAt và updatedAt tự động thêm vào
    }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;