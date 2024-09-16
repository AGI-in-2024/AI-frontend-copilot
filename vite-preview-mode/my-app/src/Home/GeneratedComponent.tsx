import React from 'react';
import { Grid, Input, DatePicker, Checkbox, Button } from '@nlmk/ds-2.0';

const Interface: React.FC = () => {
  return (
    <Grid container spacing={2}>
      <Grid.Row>
        <Grid.Column xs={12} sm={6}>
          <Input label="Username" placeholder="Enter your username" fullWidth />
        </Grid.Column>
        <Grid.Column xs={12} sm={6}>
          <Input label="Email" type="email" placeholder="Enter your email" fullWidth />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column xs={12} sm={6}>
          <Input label="Password" type="password" placeholder="Enter your password" fullWidth />
        </Grid.Column>
        <Grid.Column xs={12} sm={6}>
          <DatePicker label="Date of Birth" fullWidth />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column xs={12} sm={6}>
          <Checkbox label="I agree to the terms and conditions" />
        </Grid.Column>
        <Grid.Column xs={12} sm={6}>
          <Checkbox label="Subscribe to newsletter" />
        </Grid.Column>
      </Grid.Row>
      <Grid.Row>
        <Grid.Column xs={12}>
          <Button variant="contained" color="primary" fullWidth>
            Register
          </Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Interface;