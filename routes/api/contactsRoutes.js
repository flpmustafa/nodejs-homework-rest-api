const express = require('express')
const router = express.Router()
const { contactSchema } = require('../../Utils/validation');

const { listContacts,
  getContactById,
  addContact,
  removeContact,
  updateContact } = require('../../models/contacts');

router.get('/', async (req, res, next) => {
 try {
    const contacts = await listContacts();
    res.status(200).json(contacts);
  } catch (error) {
    next(error);
  }
})

router.get('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const contact = await getContactById(contactId);

    if (contact) {
      res.status(200).json(contact);
    } else {
      res.status(404).json({ message: 'Not found' });
    }
  } catch (error) {
    next(error);
  }
})

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
})

router.delete('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const deletedContactId = await removeContact(contactId);

    if (!deletedContactId) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    res.json({ message: 'Contact deleted' });
  } catch (error) {
    next(error);
  }
})

router.put('/:contactId', async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { error, value } = contactSchema.validate(req.body);

    if (error) {
      res.status(400).json({ message: 'Validation error' });
      return;
    }

    const updatedContact = await updateContact(contactId, value);

    if (!updatedContact) {
      res.status(404).json({ message: 'Not found' });
      return;
    }

    res.json(updatedContact);
  } catch (error) {
    next(error);
  }
})

module.exports = router
