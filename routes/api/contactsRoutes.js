const express = require('express');
const router = express.Router();
const { contactSchema } = require('../../Utils/validation');

const { listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact,
  updateContactStatus } = require('../../controller/contactsController');

router.get('/', listContacts);

router.get('/:contactId', getContactById);

router.post('/', async (req, res, next) => {
  try {
    const { error, value } = contactSchema.validate(req.body);
    if (error) {
      res.status(400).json({ message: 'Validation error' });
      return;
    }
    const newContact = await addContact(value);
    res.status(201).json(newContact);
  } catch (error) {
    next(error);
  }
});

router.delete('/:contactId', removeContact);
router.put('/:contactId', updateContact);
router.patch('/:contactId/preferite', updateContactStatus);
module.exports = router;
