import mongoose from 'mongoose'

const { Schema } = mongoose

const options = { timestamps: true }
const personRef = { type: Schema.Types.ObjectId, ref: 'User' }

const startupSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  industry: { type: String, trim: true, maxlength: 80, default: '' },
  stage: { type: String, enum: ['Idea', 'Pre-seed', 'Seed', 'Series A', 'Growth'], default: 'Idea' },
  status: { type: String, enum: ['Active', 'Paused', 'Graduated'], default: 'Active' },
  website: { type: String, trim: true, maxlength: 200, default: '' },
  location: { type: String, trim: true, maxlength: 120, default: '' },
  cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
  mentorIds: [{ type: Schema.Types.ObjectId, ref: 'Mentor' }],
  teamSize: { type: Number, min: 1, max: 10000, default: 1 },
}, options)

const cohortSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  startDate: { type: Date, default: null },
  endDate: { type: Date, default: null },
  status: { type: String, enum: ['Planned', 'Active', 'Completed'], default: 'Active' },
}, options)

const mentorSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
  expertise: { type: String, trim: true, maxlength: 500, default: '' },
  availability: { type: String, trim: true, maxlength: 300, default: '' },
}, options)

const sessionSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: 'Mentor', default: null },
  date: { type: Date, required: true },
  startTime: { type: String, trim: true, default: '' },
  endTime: { type: String, trim: true, default: '' },
  agenda: { type: String, trim: true, maxlength: 2000, default: '' },
  notes: { type: String, trim: true, maxlength: 5000, default: '' },
  status: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'Missed'], default: 'Scheduled' },
  rating: { type: Number, min: 1, max: 5, default: null },
}, options)

const milestoneSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', required: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  dueDate: { type: Date, default: null },
  status: { type: String, enum: ['Not started', 'In progress', 'Completed'], default: 'Not started' },
  weight: { type: Number, min: 1, max: 100, default: 1 },
}, options)

const resourceSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  category: { type: String, trim: true, maxlength: 80, default: 'Other' },
  quantity: { type: Number, min: 1, max: 100000, default: 1 },
  available: { type: Number, min: 0, max: 100000, default: 1 },
  startupId: { type: Schema.Types.ObjectId, ref: 'Startup', default: null },
  cohortId: { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
  allocatedUntil: { type: Date, default: null },
  status: { type: String, enum: ['Available', 'Allocated', 'Maintenance'], default: 'Available' },
}, options)

const notificationSchema = new Schema({
  ownerId: { ...personRef, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, required: true, trim: true, maxlength: 1000 },
  type: { type: String, enum: ['session', 'milestone', 'resource', 'general'], default: 'general' },
  readAt: { type: Date, default: null },
}, options)

const model = (name, schema) => mongoose.models[name] || mongoose.model(name, schema)

export const Startup = model('Startup', startupSchema)
export const Cohort = model('Cohort', cohortSchema)
export const Mentor = model('Mentor', mentorSchema)
export const MentorSession = model('MentorSession', sessionSchema)
export const Milestone = model('Milestone', milestoneSchema)
export const Resource = model('Resource', resourceSchema)
export const Notification = model('Notification', notificationSchema)
