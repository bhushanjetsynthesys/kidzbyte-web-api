const AWS = require('@aws-sdk/client-ses');
const { logger } = require('./logger');

const emailClient = new AWS.SES({
  region: process.env.SES_REGION,
  credentials: {
    accessKeyId: process.env.SES_KEY,
    secretAccessKey: process.env.SES_SECRET,
  },
});

/**
 * Sends email
 * @param {Object} data - data
 */
exports.sendEmail = async (toEmails, subject, textBody, htmlBody = null, ccEmails = null, replyTo = null, fromEmail = process.env.MAIL_FROM_ADDRESS, senderName = '') => {
  logger.info('mailer@sendEmail');
  try {
    const message = {
      Destination: {
        ToAddresses: [toEmails],
      },
      Message: {
        Body: {
          Text: {
            Data: textBody,
          },
          Html: {
            Charset: 'UTF-8',
            Data: htmlBody,
          },
        },
        Subject: {
          Data: subject,
        },
      },
      Source: `${senderName} <${fromEmail}>`,
    };
    if (replyTo) {
      message.ReplyToAddresses = replyTo;
    }

    if (ccEmails) {
      message.Destination.CcAddresses = ccEmails;
    }
    const result = await emailClient.sendEmail(message);
    return result;
  } catch (err) {
    logger.error(err);
    throw new Error(err);
  }
};
