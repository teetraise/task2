const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: [true, 'User ID is required']
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['created', 'in_progress', 'completed', 'cancelled'],
    default: 'created'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  assignedTo: {
    type: String
  },
  dueDate: {
    type: Date
  }
}, {
  timestamps: true
});

orderSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Order', orderSchema);
