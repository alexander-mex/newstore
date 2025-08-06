import React from 'react';
import EmailVerifyMessage from './EmailVerifyMessage';

const EmailVerifiedSuccess = ({ darkMode, language }) => {
  return <EmailVerifyMessage success={true} darkMode={darkMode} language={language} />;
};

export default EmailVerifiedSuccess;