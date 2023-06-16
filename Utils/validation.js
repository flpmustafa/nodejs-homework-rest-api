const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string().required(),
});

const userEmailSchema = Joi.object({
  email: Joi.string().email().required(),
});

module.exports = {
  contactSchema,
  userEmailSchema
};