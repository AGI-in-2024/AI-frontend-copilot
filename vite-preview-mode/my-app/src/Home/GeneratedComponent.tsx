import React, { useState } from 'react';
import { Grid, Input, Checkbox, Button, Alert } from '@nlmk/ds-2.0';

const Interface: React.FC = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email || !password || !agreed) {
      setShowError(true);
    } else {
      setShowError(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Grid borderRadius="var(--4-border)" st={{ width: '100%', maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
        <Grid.Row>
          <Grid.Column width="100%">
            <Input
              label="Username"
              helperText="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width="100%">
            <Input
              label="Email"
              helperText="Enter your email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width="100%">
            <Input
              label="Password"
              helperText="Enter your password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width="100%">
            <Checkbox
              label="I agree to the terms and conditions"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
            />
          </Grid.Column>
        </Grid.Row>
        <Grid.Row>
          <Grid.Column width="100%">
            <Button variant="primary" type="submit" st={{ width: '100%' }}>
              Register
            </Button>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      {showError && (
        <Alert title="Form Error" severity="error" st={{ marginTop: '20px' }}>
          Please fill out all required fields.
        </Alert>
      )}
    </form>
  );
};

export default Interface;