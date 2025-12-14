const mongoose = require('mongoose');

// Schema for storing user's shortcuts data in MongoDB
// This replaces the file-based storage (db.json, demo_db.json, etc.)
const userDataSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  // Special identifiers for admin and demo data
  dataType: {
    type: String,
    enum: ['admin', 'demo', 'client'],
    default: 'client'
  },
  leaderShortcuts: {
    type: Array,
    default: []
  },
  leaderGroups: {
    type: Array,
    default: []
  },
  raycastShortcuts: {
    type: Array,
    default: []
  },
  systemShortcuts: {
    type: Array,
    default: []
  },
  appsLibrary: {
    type: Array,
    default: []
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  // Allow flexible schema for nested shortcut objects
  strict: false
});

// Index for faster lookups - only add non-unique indexes here
// userId index is already created by `unique: true` in the schema
userDataSchema.index({ dataType: 1 });

module.exports = mongoose.model('UserData', userDataSchema);
