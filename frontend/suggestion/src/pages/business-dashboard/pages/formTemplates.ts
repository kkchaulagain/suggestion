/**
 * Form template definitions for the create-form flow.
 * Kept in a separate file to keep CreateFormPage focused on UI and state.
 */

export type FormKind = 'form' | 'poll' | 'survey'

export type TemplateFieldType =
  | 'checkbox'
  | 'radio'
  | 'short_text'
  | 'long_text'
  | 'big_text'
  | 'image_upload'
  | 'name'
  | 'email'
  | 'scale_1_10'
  | 'rating'

export interface TemplateField {
  name: string
  label: string
  type: TemplateFieldType
  required: boolean
  placeholder?: string
  options?: string[]
  allowAnonymous?: boolean
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

export interface FormTemplate {
  id: string
  label: string
  description: string
  iconName: TemplateIconName
  title: string
  formDescription: string
  kind: FormKind
  fields: TemplateField[]
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
      { name: 'category', label: 'Category', type: 'radio', required: false, options: ['Quality', 'Service', 'Value', 'Other'] },
      { name: 'comments', label: 'Additional comments', type: 'short_text', required: false, placeholder: '' },
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
      { name: 'highlight', label: 'What was the best part?', type: 'short_text', required: false, placeholder: 'e.g. keynote, networking, venue' },
      { name: 'improve', label: 'What could we improve?', type: 'long_text', required: false, placeholder: '' },
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
      { name: 'comment', label: 'Anything else? (optional)', type: 'short_text', required: false, placeholder: '' },
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
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'visit_date', label: 'Visit / service date', type: 'short_text', required: false, placeholder: '' },
      { name: 'overall_rating', label: 'Overall experience', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'enjoyed', label: 'What did you enjoy?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could we improve?', type: 'long_text', required: false, placeholder: '' },
      { name: 'would_recommend', label: 'Would you recommend us?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments', label: 'Any other comments?', type: 'big_text', required: false, placeholder: '' },
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
    fields: [
      { name: 'name', label: 'Full name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'organisation', label: 'Organisation / company', type: 'short_text', required: false, placeholder: '' },
      { name: 'event_name', label: "Event you're registering for", type: 'short_text', required: true, placeholder: '' },
      { name: 'attendees_count', label: 'Number of attendees', type: 'short_text', required: true, placeholder: '' },
      { name: 'dietary_requests', label: 'Dietary requirements / special requests', type: 'long_text', required: false, placeholder: '' },
      { name: 'how_heard', label: 'How did you hear about us?', type: 'radio', required: false, options: ['Social Media', 'Friend', 'Email', 'Website', 'Other'] },
      { name: 'supporting_doc', label: 'Upload supporting document', type: 'image_upload', required: false, placeholder: '' },
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
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'issue_title', label: 'Issue title', type: 'short_text', required: true, placeholder: '' },
      { name: 'system_area', label: 'Which part of the system?', type: 'short_text', required: false, placeholder: '' },
      { name: 'steps_to_reproduce', label: 'Steps to reproduce', type: 'big_text', required: true, placeholder: '' },
      { name: 'expected', label: 'Expected behaviour', type: 'long_text', required: false, placeholder: '' },
      { name: 'actual', label: 'Actual behaviour', type: 'long_text', required: true, placeholder: '' },
      { name: 'severity', label: 'Severity', type: 'radio', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'screenshot', label: 'Screenshot / attachment', type: 'image_upload', required: false, placeholder: '' },
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
      { name: 'name', label: 'Full name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'position', label: 'Position applied for', type: 'short_text', required: true, placeholder: '' },
      { name: 'experience', label: 'Years of experience', type: 'radio', required: true, options: ['0–1', '1–3', '3–5', '5+'] },
      { name: 'how_heard', label: 'How did you hear about this role?', type: 'radio', required: false, options: ['Website', 'LinkedIn', 'Referral', 'Other'] },
      { name: 'cover_letter', label: 'Cover letter', type: 'big_text', required: true, placeholder: '' },
      { name: 'links', label: 'Portfolio / LinkedIn / GitHub links', type: 'long_text', required: false, placeholder: '' },
      { name: 'resume', label: 'Resume / CV', type: 'image_upload', required: true, placeholder: '' },
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
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'product_name', label: 'Product name', type: 'short_text', required: true, placeholder: '' },
      { name: 'rating', label: 'Overall rating', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'liked', label: 'What did you like?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could be improved?', type: 'long_text', required: false, placeholder: '' },
      { name: 'buy_again', label: 'Would you buy this again?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'product_photo', label: 'Upload a product photo', type: 'image_upload', required: false, placeholder: '' },
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
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'subject', label: 'Subject', type: 'short_text', required: true, placeholder: '' },
      { name: 'inquiry_type', label: 'Inquiry type', type: 'radio', required: true, options: ['General', 'Support', 'Sales', 'Partnership', 'Other'] },
      { name: 'message', label: 'Your message', type: 'big_text', required: true, placeholder: '' },
      { name: 'preferred_contact', label: 'Preferred contact method', type: 'radio', required: false, options: ['Email', 'Phone'] },
      { name: 'best_time', label: 'Best time to contact', type: 'short_text', required: false, placeholder: '' },
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
      { name: 'name', label: 'Your name', type: 'short_text', required: true, placeholder: '' },
      { name: 'email', label: 'Email', type: 'short_text', required: true, placeholder: '' },
      { name: 'phone', label: 'Phone', type: 'short_text', required: false, placeholder: '' },
      { name: 'service', label: 'Service requested', type: 'short_text', required: true, placeholder: '' },
      { name: 'preferred_date', label: 'Preferred date', type: 'short_text', required: true, placeholder: '' },
      { name: 'preferred_time', label: 'Preferred time', type: 'radio', required: true, options: ['Morning', 'Afternoon', 'Evening'] },
      { name: 'alt_date', label: 'Alternative date', type: 'short_text', required: false, placeholder: '' },
      { name: 'notes', label: 'Special requirements / notes', type: 'long_text', required: false, placeholder: '' },
      { name: 'how_found', label: 'How did you find us?', type: 'radio', required: false, options: ['Search', 'Referral', 'Social Media', 'Other'] },
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
    fields: [
      { name: 'employee_name', label: 'Your name (optional)', type: 'short_text', required: false, placeholder: '' },
      { name: 'department', label: 'Department (optional)', type: 'short_text', required: false, placeholder: '' },
      { name: 'job_satisfaction', label: 'Job satisfaction', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'management', label: 'Management satisfaction', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'work_life_balance', label: 'Work-life balance', type: 'rating', required: true, options: STAR_RATING_OPTIONS },
      { name: 'doing_well', label: 'What are we doing well?', type: 'long_text', required: false, placeholder: '' },
      { name: 'improve', label: 'What could be improved?', type: 'long_text', required: false, placeholder: '' },
      { name: 'recommend', label: 'Would you recommend working here?', type: 'radio', required: true, options: ['Yes', 'No', 'Maybe'] },
      { name: 'comments', label: 'Additional comments', type: 'big_text', required: false, placeholder: '' },
    ],
  },
]
