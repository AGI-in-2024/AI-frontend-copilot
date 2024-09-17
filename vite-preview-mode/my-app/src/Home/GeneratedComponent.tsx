import React from 'react';
import { Grid, Input, DatePicker, SimpleSelect, OptionItem, Checkbox, Button } from '@nlmk/ds-2.0';

const Interface: React.FC = () => {
  return (
    <Grid>
      <Grid.Row>
        <Grid.Column width="100%">
          <Input label="Username" placeholder="Enter your username" />
        </Grid.Column>
        <Grid.Column width="100%">
          <Input label="Email" placeholder="Enter your email" type="email" />
        </Grid.Column>
        <Grid.Column width="100%">
          <Input label="Password" placeholder="Enter your password" type="password" />
        </Grid.Column>
        <Grid.Column width="100%">
          <DatePicker label="Date of Birth" />
        </Grid.Column>
        <Grid.Column width="100%">
          <SimpleSelect label="Gender" placeholder="Select your gender">
            <OptionItem value="male" label="Male" />
            <OptionItem value="female" label="Female" />
            <OptionItem value="other" label="Other" />
          </SimpleSelect>
        </Grid.Column>
        <Grid.Column width="100%">
          <Checkbox label="I agree to the terms and conditions" />
        </Grid.Column>
        <Grid.Column width="100%">
          <Button type="submit">Register</Button>
        </Grid.Column>
      </Grid.Row>
    </Grid>
  );
};

export default Interface;