const Joi = require('joi');

const schemas = {
  createOrder: Joi.object({
    title: Joi.string().required(),
    description: Joi.string(),
    priority: Joi.string().valid('low', 'medium', 'high'),
    dueDate: Joi.date()
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('created', 'in_progress', 'completed', 'cancelled').required()
  })
};

const validate = (schemaName) => {
  return (req, res, next) => {
    const schema = schemas[schemaName];

    if (!schema) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'Validation schema not found'
        }
      });
    }

    const { error, value } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: errors.join(', ')
        }
      });
    }

    req.validatedData = value;
    next();
  };
};

module.exports = {
  validateCreateOrder: validate('createOrder'),
  validateUpdateStatus: validate('updateStatus')
};
