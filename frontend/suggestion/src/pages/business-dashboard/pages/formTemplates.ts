/**
 * Form template definitions for the create-form flow.
 * Kept in a separate file to keep CreateFormPage focused on UI and state.
 */

export type FormKind = 'form' | 'poll' | 'survey'

export type TemplateFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'number'
  | 'date'
  | 'time'
  | 'url'
  | 'checkbox'
  | 'radio'
  | 'dropdown'
  | 'scale'
  | 'rating'
  | 'image'

export interface TemplateField {
  name: string
  label: string
  type: TemplateFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
  stepId?: string
  stepOrder?: number
}

export type TemplateIconName =
  | 'MessageSquare'
  | 'Calendar'
  | 'Bug'
  | 'Briefcase'
  | 'Star'
  | 'Mail'
  | 'CalendarClock'
  | 'Users'
  | 'BarChart2'
  | 'ListChecks'

export interface FormStep {
  id: string
  title: string
  description?: string
  order: number
}

export interface FormTemplate {
  id: string
  label: string
  description: string
  iconName: TemplateIconName
  title: string
  formDescription: string
  kind: FormKind
  fields: TemplateField[]
  steps?: FormStep[]
}

const STAR_RATING_OPTIONS = ['★ 1 Star', '★★ 2 Stars', '★★★ 3 Stars', '★★★★ 4 Stars', '★★★★★ 5 Stars']

export const FORM_TEMPLATES: FormTemplate[] = [
  {
    id: 'poll',
    label: 'Poll',
    description: 'Single question with predefined options. Quick vote or choice.',
    iconName: 'BarChart2',
    title: 'Quick Poll',
    formDescription: 'Cast your vote.',
    kind: 'poll',
    fields: [
      { name: 'vote', label: "What's your choice?", type: 'radio', required: true, options: ['Option A', 'Option B', 'Option C'] },
    ],
  },
  {
    id: 'poll-meeting-time',
    label: 'Meeting Time Poll',
    description: 'Let people vote for their preferred meeting or event time.',
    iconName: 'BarChart2',
    title: 'When works best?',
    formDescription: 'Vote for your preferred time. We will schedule based on the results.',
    kind: 'poll',
    fields: [
      {
        name: 'preferred_time',
        label: 'When works best for you?',
        type: 'radio',
        required: true,
        options: ['Morning (9am–12pm)', 'Afternoon (12pm–5pm)', 'Evening (5pm–8pm)'],
      },
    ],
  },
  {
    id: 'poll-satisfaction',
    label: 'Satisfaction Poll',
    description: 'Quick one-question satisfaction check.',
    iconName: 'BarChart2',
    title: 'How satisfied are you?',
    formDescription: 'Your feedback helps us improve.',
    kind: 'poll',
    fields: [
      {
        name: 'satisfaction',
        label: 'How satisfied are you with your experience?',
        type: 'radio',
        required: true,
        options: ['Very satisfied', 'Satisfied', 'Neutral', 'Dissatisfied', 'Very dissatisfied'],
      },
    ],
  },
  {
    id: 'survey',
    label: 'Survey',
    description: 'Multiple questions: ratings, choices, and open feedback.',
    iconName: 'ListChecks',
    title: 'Survey',
    formDescription: 'We value your feedback. Please answer the following questions.',
    kind: 'survey',
    fields: [
      { name: 'rating', label: 'Overall rating', type: 'radio', required: true, options: ['Poor', 'Fair', 'Good', 'Excellent'] },
      { name: 'category', label: 'Category', type: 'dropdown', required: false, options: ['Quality', 'Service', 'Value', 'Other'] },
      { name: 'comments', label: 'Additional comments', type: 'text', required: false, placeholder: '' },
    ],
  },
  {
    id: 'survey-event-feedback',
    label: 'Event Feedback Survey',
    description: 'Collect feedback after an event: rating, highlights, and recommendations.',
    iconName: 'ListChecks',
    title: 'Event Feedback',
    formDescription: 'Thank you for attending. Please share your feedback so we can improve future events.',
    kind: 'survey',
    fields: [
      { name: 'rating', label: 'How would you rate this event?', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'highlight', label: 'What was the best part?', type: 'text', required: false, placeholder: 'e.g. keynote, networking, venue' },
      { name: 'improve', label: 'What could we improve?', type: 'textarea', required: false, placeholder: '' },
      { name: 'attend_again', label: 'Would you attend again?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
    ],
  },
  {
    id: 'survey-quick-feedback',
    label: 'Quick Feedback Survey',
    description: 'Short 3-question survey: rating, recommendation, and optional comment.',
    iconName: 'ListChecks',
    title: 'Quick Feedback',
    formDescription: 'A few quick questions to help us serve you better.',
    kind: 'survey',
    fields: [
      { name: 'rating', label: 'Overall experience', type: 'radio', required: true, options: ['Poor', 'Fair', 'Good', 'Excellent'] },
      { name: 'recommend', label: 'Would you recommend us?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comment', label: 'Anything else? (optional)', type: 'text', required: false, placeholder: '' },
    ],
  },
  {
    id: 'customer-feedback',
    label: 'Customer Feedback',
    description: 'Collect ratings and comments from customers.',
    iconName: 'MessageSquare',
    title: 'Customer Feedback',
    formDescription: 'We value your feedback. Please take a moment to share your experience.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'visit_date', label: 'Visit / service date', type: 'date', required: false },
      { name: 'overall_rating', label: 'Overall experience', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'enjoyed', label: 'What did you enjoy?', type: 'textarea', required: false, placeholder: '' },
      { name: 'improve', label: 'What could we improve?', type: 'textarea', required: false, placeholder: '' },
      { name: 'would_recommend', label: 'Would you recommend us?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments', label: 'Any other comments?', type: 'textarea', required: false, placeholder: '' },
    ],
  },
  {
    id: 'event-registration',
    label: 'Event Registration',
    description: 'Register attendees for workshops and events.',
    iconName: 'Calendar',
    title: 'Event Registration',
    formDescription: 'Register for our event. We will confirm your attendance by email.',
    kind: 'form',
    steps: [
      { id: 'evt-step-contact', title: 'Contact Information', order: 0 },
      { id: 'evt-step-event', title: 'Event Details', order: 1 },
    ],
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: '', stepId: 'evt-step-contact', stepOrder: 0 },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '', stepId: 'evt-step-contact', stepOrder: 1 },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '', stepId: 'evt-step-contact', stepOrder: 2 },
      { name: 'organisation', label: 'Organisation / company', type: 'text', required: false, placeholder: '', stepId: 'evt-step-contact', stepOrder: 3 },
      { name: 'event_name', label: "Event you're registering for", type: 'text', required: true, placeholder: '', stepId: 'evt-step-event', stepOrder: 0 },
      { name: 'attendees_count', label: 'Number of attendees', type: 'number', required: true, placeholder: '1', stepId: 'evt-step-event', stepOrder: 1 },
      { name: 'dietary_requests', label: 'Dietary requirements / special requests', type: 'textarea', required: false, placeholder: '', stepId: 'evt-step-event', stepOrder: 2 },
      { name: 'how_heard', label: 'How did you hear about us?', type: 'dropdown', required: false, options: ['Social Media', 'Friend', 'Email', 'Website', 'Other'], stepId: 'evt-step-event', stepOrder: 3 },
      { name: 'supporting_doc', label: 'Upload supporting document', type: 'image', required: false, placeholder: '', stepId: 'evt-step-event', stepOrder: 4 },
    ],
  },
  {
    id: 'bug-report',
    label: 'Bug / Issue Report',
    description: 'Report bugs and technical issues.',
    iconName: 'Bug',
    title: 'Bug / Issue Report',
    formDescription: 'Help us improve by describing the issue you encountered.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'issue_title', label: 'Issue title', type: 'text', required: true, placeholder: '' },
      { name: 'system_area', label: 'Which part of the system?', type: 'text', required: false, placeholder: '' },
      { name: 'steps_to_reproduce', label: 'Steps to reproduce', type: 'textarea', required: true, placeholder: '' },
      { name: 'expected', label: 'Expected behaviour', type: 'textarea', required: false, placeholder: '' },
      { name: 'actual', label: 'Actual behaviour', type: 'textarea', required: true, placeholder: '' },
      { name: 'severity', label: 'Severity', type: 'dropdown', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'screenshot', label: 'Screenshot / attachment', type: 'image', required: false, placeholder: '' },
    ],
  },
  {
    id: 'job-application',
    label: 'Job Application',
    description: 'Collect applications for open positions.',
    iconName: 'Briefcase',
    title: 'Job Application',
    formDescription: 'Apply for this position. We will review your application and get in touch.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Full name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'position', label: 'Position applied for', type: 'text', required: true, placeholder: '' },
      { name: 'experience', label: 'Years of experience', type: 'number', required: true, placeholder: '' },
      { name: 'how_heard', label: 'How did you hear about this role?', type: 'dropdown', required: false, options: ['Website', 'LinkedIn', 'Referral', 'Other'] },
      { name: 'cover_letter', label: 'Cover letter', type: 'textarea', required: true, placeholder: '' },
      { name: 'links', label: 'Portfolio / LinkedIn / GitHub links', type: 'url', required: false, placeholder: 'https://' },
      { name: 'resume', label: 'Resume / CV', type: 'image', required: true, placeholder: '' },
    ],
  },
  {
    id: 'product-review',
    label: 'Product Review',
    description: 'Gather product ratings and reviews.',
    iconName: 'Star',
    title: 'Product Review',
    formDescription: 'Share your experience with this product.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'product_name', label: 'Product name', type: 'text', required: true, placeholder: '' },
      { name: 'rating', label: 'Overall rating', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'liked', label: 'What did you like?', type: 'textarea', required: false, placeholder: '' },
      { name: 'improve', label: 'What could be improved?', type: 'textarea', required: false, placeholder: '' },
      { name: 'buy_again', label: 'Would you buy this again?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'product_photo', label: 'Upload a product photo', type: 'image', required: false, placeholder: '' },
    ],
  },
  {
    id: 'contact-inquiry',
    label: 'Contact / Inquiry',
    description: 'General contact and support inquiries.',
    iconName: 'Mail',
    title: 'Contact / Inquiry',
    formDescription: 'Send us a message. We will respond as soon as possible.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'subject', label: 'Subject', type: 'text', required: true, placeholder: '' },
      { name: 'inquiry_type', label: 'Inquiry type', type: 'dropdown', required: true, options: ['General', 'Support', 'Sales', 'Partnership', 'Other'] },
      { name: 'message', label: 'Your message', type: 'textarea', required: true, placeholder: '' },
      { name: 'preferred_contact', label: 'Preferred contact method', type: 'radio', required: false, options: ['Email', 'Phone'] },
      { name: 'best_time', label: 'Best time to contact', type: 'time', required: false },
    ],
  },
  {
    id: 'appointment-booking',
    label: 'Appointment / Booking',
    description: 'Request appointments and bookings.',
    iconName: 'CalendarClock',
    title: 'Appointment / Booking Request',
    formDescription: 'Request an appointment. We will confirm availability by email or phone.',
    kind: 'form',
    fields: [
      { name: 'name', label: 'Your name', type: 'text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'email', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'phone', required: false, placeholder: '' },
      { name: 'service', label: 'Service requested', type: 'text', required: true, placeholder: '' },
      { name: 'preferred_date', label: 'Preferred date', type: 'date', required: true },
      { name: 'preferred_time', label: 'Preferred time', type: 'time', required: true },
      { name: 'alt_date', label: 'Alternative date', type: 'date', required: false },
      { name: 'notes', label: 'Special requirements / notes', type: 'textarea', required: false, placeholder: '' },
      { name: 'how_found', label: 'How did you find us?', type: 'dropdown', required: false, options: ['Search', 'Referral', 'Social Media', 'Other'] },
    ],
  },
  {
    id: 'employee-survey',
    label: 'Employee Survey',
    description: 'Internal feedback and satisfaction survey.',
    iconName: 'Users',
    title: 'Employee Survey',
    formDescription: 'Your feedback helps us improve the workplace. All responses are confidential.',
    kind: 'survey',
    steps: [
      { id: 'emp-step-info', title: 'Your Information', order: 0 },
      { id: 'emp-step-ratings', title: 'Satisfaction Ratings', order: 1 },
      { id: 'emp-step-comments', title: 'Open Feedback', order: 2 },
    ],
    fields: [
      { name: 'employee_name', label: 'Your name (optional)', type: 'text', required: false, placeholder: '', stepId: 'emp-step-info', stepOrder: 0 },
      { name: 'department', label: 'Department (optional)', type: 'text', required: false, placeholder: '', stepId: 'emp-step-info', stepOrder: 1 },
      { name: 'job_satisfaction', label: 'Job satisfaction', type: 'rating', required: true, options: STAR_RATING_OPTIONS, stepId: 'emp-step-ratings', stepOrder: 0 },
      { name: 'management', label: 'Management satisfaction', type: 'rating', required: true, options: STAR_RATING_OPTIONS, stepId: 'emp-step-ratings', stepOrder: 1 },
      { name: 'work_life_balance', label: 'Work-life balance', type: 'rating', required: true, options: STAR_RATING_OPTIONS, stepId: 'emp-step-ratings', stepOrder: 2 },
      { name: 'doing_well', label: 'What are we doing well?', type: 'textarea', required: false, placeholder: '', stepId: 'emp-step-comments', stepOrder: 0 },
      { name: 'improve', label: 'What could be improved?', type: 'textarea', required: false, placeholder: '', stepId: 'emp-step-comments', stepOrder: 1 },
      { name: 'recommend', label: 'Would you recommend working here?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'], stepId: 'emp-step-comments', stepOrder: 2 },
      { name: 'comments', label: 'Additional comments', type: 'textarea', required: false, placeholder: '', stepId: 'emp-step-comments', stepOrder: 3 },
    ],
  },
]
