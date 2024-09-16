import React from 'react';
import GeneratedComponent from './GeneratedComponent';
import styles from './index.module.css';

const Home: React.FC = () => {
  return (
    <div className={styles.container}>
      <h1>Generated Component Preview</h1>
      <div className={styles.componentWrapper}>
        <GeneratedComponent />
      </div>
    </div>
  );
};

export default Home;