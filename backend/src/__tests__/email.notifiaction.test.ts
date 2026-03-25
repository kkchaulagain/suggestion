jest.mock('../email', () => ({
  transporter: {
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mocked-id' }),
  },
}));

const { transporter } = require('../email');
const { EmailNotification } = require('../notification/email.notifiaction');

describe('EmailNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends user confirmation template for regular message', async () => {
    const notification = new EmailNotification('user@example.com', 'thank you for your feedback!,your response has been recorded.');
    await notification.send();

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'user@example.com',
      subject: 'Feedback Submission Confirmation',
      html: expect.stringContaining('Thanks for your feedback'),
    }));
  });

  it('sends business template when message contains form and submitter lines', async () => {
    const notification = new EmailNotification(
      'biz@example.com',
      'New form submission received.\nForm: Event Feedback\nSubmitted by: Anonymous',
    );
    await notification.send();

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'biz@example.com',
      subject: 'New Feedback Form Submission',
      html: expect.stringContaining('New feedback form submission'),
    }));

    const mailArg = transporter.sendMail.mock.calls[0][0];
    expect(mailArg.html).toContain('Form Name');
    expect(mailArg.html).toContain('Event Feedback');
    expect(mailArg.html).toContain('Submitted By');
    expect(mailArg.html).toContain('Anonymous');
  });

  it('replaces form placeholders and attaches QR image for campaign emails', async () => {
    const notification = new EmailNotification('campaign@example.com', 'ignored', {
      subject: 'Please complete this form',
      rawHtmlBody: '<div><h1>{{FORM_TITLE}}</h1><a href="{{FORM_LINK}}">{{FORM_LINK}}</a>{{FORM_QR_IMAGE}}</div>',
      formTitle: 'NPS Survey',
      formUrl: 'https://frontend.example.com/forms/123',
      qrCodeDataUrl: 'data:image/png;base64,aGVsbG8=',
    });

    await notification.send();

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const mailArg = transporter.sendMail.mock.calls[0][0];
    expect(mailArg.subject).toBe('Please complete this form');
    expect(mailArg.html).toContain('NPS Survey');
    expect(mailArg.html).toContain('https://frontend.example.com/forms/123');
    expect(mailArg.html).toContain('cid:feedback-form-qr');
    expect(mailArg.attachments).toEqual([
      expect.objectContaining({
        filename: 'feedback-form-qr.png',
        cid: 'feedback-form-qr',
        contentType: 'image/png',
      }),
    ]);
  });

  it('renders QR unavailable placeholder when campaign template includes QR token without data URL', async () => {
    const notification = new EmailNotification('campaign@example.com', 'ignored', {
      subject: 'Please complete this form',
      rawHtmlBody: '<div>{{FORM_TITLE}}{{FORM_QR_IMAGE}}</div>',
      formTitle: 'NPS Survey',
      formUrl: 'https://frontend.example.com/forms/123',
    });

    await notification.send();

    expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    const mailArg = transporter.sendMail.mock.calls[0][0];
    expect(mailArg.html).toContain('QR unavailable');
    expect(mailArg.attachments).toBeUndefined();
  });
});
