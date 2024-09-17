// Import necessary components
import React from 'react';
import { Header, Grid, Box, Typography, Card, ImagePicture, Button, Divider, Snackbar } from '@nlmk/ds-2.0';

// Main component structure based on JSON
const Interface: React.FC = () => {
  return (
    <div>
      <Header title="Welcome to Our Landing Page" bg={true} type="default" date={true} />
      <Grid borderRadius="var(--4-border)" st={{ width: '100%', padding: 0 }}>
        <Grid.Row borderRadius="var(--4-border)" background="var(--error-red-100)">
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box px="var(--8-space)" py="var(--16-space)" borderRadius="var(--4-border)" background="var(--primary-blue-400)" st={{ flex: '1' }}>
              <Typography variant="Body1-Medium">Content 1</Typography>
            </Box>
          </Grid.Column>
          <Grid.Column borderRadius="var(--4-border)" background="var(--primary-blue-400)" width="50%">
            <Box px="var(--8-space)" py="var(--16-space)" borderRadius="var(--4-border)" background="var(--primary-blue-400)" st={{ flex: '1' }}>
              <Typography variant="Body1-Medium">Content 2</Typography>
            </Box>
          </Grid.Column>
        </Grid.Row>
      </Grid>
      <Card orientation="vertical" indicatorSize="s" indicatorStatus="default">
        <ImagePicture src="https://example.com/image.jpg" aspectRatio="ratio-16x9" radius="radius-4px" alt="Example Image" />
        <Typography variant="Heading2">Card Title</Typography>
        <Typography variant="Body1-Medium">Card description goes here.</Typography>
        <Button variant="primary">Learn More</Button>
      </Card>
      <Divider dashed={false} orientation="center" orientationSpace={0} type="horizontal" />
      <Snackbar color="dark" variant="solid" autoHideDuration={3000}>
        This is a notification message.
      </Snackbar>
    </div>
  );
};

// Export the main component
export default Interface;