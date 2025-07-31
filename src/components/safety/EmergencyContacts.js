import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { safetyService } from '../../services/safetyService';
import Button from '../common/Button';
import toast from 'react-hot-toast';

const EmergencyContacts = () => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingContact, setEditingContact] = useState(null);

  const loadEmergencyContacts = useCallback(async () => {
    try {
      setLoading(true);
      await safetyService.initialize(user.uid);
      setContacts(safetyService.emergencyContacts);
    } catch (error) {
      console.error('Failed to load emergency contacts:', error);
      toast.error('Failed to load emergency contacts');
    } finally {
      setLoading(false);
    }
  }, [user.uid]);

  useEffect(() => {
    if (user?.uid) {
      loadEmergencyContacts();
    }
  }, [user?.uid, loadEmergencyContacts]);

  // Add new contact
  const handleAddContact = async (contactData) => {
    try {
      const result = await safetyService.addEmergencyContact(user.uid, contactData);
      if (result.success) {
        toast.success('Emergency contact added successfully');
        setShowAddForm(false);
        await loadEmergencyContacts();
      } else {
        toast.error('Failed to add emergency contact');
      }
    } catch (error) {
      console.error('Add contact error:', error);
      toast.error('Failed to add emergency contact');
    }
  };

  // Remove contact
  const handleRemoveContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to remove this emergency contact?')) {
      return;
    }

    try {
      const result = await safetyService.removeEmergencyContact(user.uid, contactId);
      if (result.success) {
        toast.success('Emergency contact removed');
        await loadEmergencyContacts();
      } else {
        toast.error('Failed to remove emergency contact');
      }
    } catch (error) {
      console.error('Remove contact error:', error);
      toast.error('Failed to remove emergency contact');
    }
  };

  // Edit contact
  const handleEditContact = async (contactId, contactData) => {
    try {
      // Remove old contact and add new one
      await safetyService.removeEmergencyContact(user.uid, contactId);
      const result = await safetyService.addEmergencyContact(user.uid, contactData);
      
      if (result.success) {
        toast.success('Emergency contact updated successfully');
        setEditingContact(null);
        await loadEmergencyContacts();
      } else {
        toast.error('Failed to update emergency contact');
      }
    } catch (error) {
      console.error('Edit contact error:', error);
      toast.error('Failed to update emergency contact');
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Emergency Contacts</h2>
          <p className="text-sm text-gray-600 mt-1">
            These contacts will be notified in case of emergency
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={contacts.length >= 5}
          className="flex items-center space-x-2"
        >
          <span>+</span>
          <span>Add Contact</span>
        </Button>
      </div>

      {/* Contact Limit Warning */}
      {contacts.length >= 5 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            Maximum of 5 emergency contacts allowed. Remove a contact to add a new one.
          </p>
        </div>
      )}

      {/* Contacts List */}
      <div className="space-y-3">
        {contacts.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📞</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Emergency Contacts</h3>
            <p className="text-gray-600 mb-4">
              Add emergency contacts to be notified in case of safety issues during rides.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              Add Your First Contact
            </Button>
          </div>
        ) : (
          contacts.map((contact) => (
            <ContactCard
              key={contact.id}
              contact={contact}
              onEdit={setEditingContact}
              onRemove={handleRemoveContact}
              isEditing={editingContact?.id === contact.id}
              onSave={handleEditContact}
              onCancel={() => setEditingContact(null)}
            />
          ))
        )}
      </div>

      {/* Add Contact Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Emergency Contact</h3>
            <ContactForm
              onSubmit={handleAddContact}
              onCancel={() => setShowAddForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

// Contact Card Component
const ContactCard = ({ contact, onEdit, onRemove, isEditing, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: contact.name,
    phone: contact.phone,
    relationship: contact.relationship || '',
    email: contact.email || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(contact.id, formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Relationship
            </label>
            <input
              type="text"
              name="relationship"
              value={formData.relationship}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Spouse, Parent, Friend"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium">
                {contact.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{contact.name}</h3>
              <p className="text-sm text-gray-600">{contact.phone}</p>
              {contact.relationship && (
                <p className="text-xs text-gray-500">{contact.relationship}</p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(contact)}
            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit contact"
          >
            ✏️
          </button>
          <button
            onClick={() => onRemove(contact.id)}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Remove contact"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
};

// Contact Form Component
const ContactForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    relationship: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) {
      toast.error('Name and phone number are required');
      return;
    }

    onSubmit(formData);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter full name"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter phone number"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Relationship
        </label>
        <input
          type="text"
          name="relationship"
          value={formData.relationship}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="e.g., Spouse, Parent, Friend"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email (Optional)
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Enter email address"
        />
      </div>

      <div className="flex space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          Add Contact
        </Button>
      </div>
    </form>
  );
};

export default EmergencyContacts; 