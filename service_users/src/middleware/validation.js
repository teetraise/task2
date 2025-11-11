const Joi = require('joi');

// Validation schemas
const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().required(),
    role: Joi.string().valid('admin', 'manager', 'engineer', 'client'),
    phone: Joi.string(),
    company: Joi.string()
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string(),
    phone: Joi.string(),
    company: Joi.string()
  }).min(1)
};

// Validation middleware factory
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
  validateRegister: validate('register'),
  validateLogin: validate('login'),
  validateUpdateProfile: validate('updateProfile')
};
