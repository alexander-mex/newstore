import React from 'react';
import EmailVerifyMessage from './EmailVerifyMessage';

const VerifyFailed = ({ darkMode, language }) => {
  return <EmailVerifyMessage success={false} darkMode={darkMode} language={language} />;
};

export default VerifyFailed;