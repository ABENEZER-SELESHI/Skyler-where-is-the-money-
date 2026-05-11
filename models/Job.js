import mongoose from 'mongoose';

/**
 * Represents a recurring messaging job.
 * Links a sender session to a receiver and schedules messages at a given interval.
 */
const jobSchema = new mongoose.Schema({
  senderUsername: {
    type: String,
    required: true,
    trim: true,
  },
  receiverUsername: {
    type: String,
    required: true,
    trim: true,
  },
  // Human-readable interval string: 10s, 5m, 1h, 1d
  interval: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  // Reference to the UserSession document for the sender
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UserSession',
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Job = mongoose.model('Job', jobSchema);

export default Job;
