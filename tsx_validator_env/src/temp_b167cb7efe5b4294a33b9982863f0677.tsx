```tsx
// Import necessary components
import React from 'react';
import {
  Button,
  Input,
  Checkbox,
  Switch,
  Link,
  Avatar,
  Badge,
  Icon,
  Divider,
  Tooltip
} from '@nlmk/ds-2.0';

// Event handlers (assuming they are defined somewhere in your project)
const handleClick = () => {
  console.log('Button clicked');
};

const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('Input changed', event.target.value);
};

const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('Checkbox changed', event.target.checked);
};

const handleSwitchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
  console.log('Switch changed', event.target.checked);
};

// Main component structure based on JSON
const Interface = () => {
  return (
    <div>
      <Button label="Click Me" onClick={handleClick} />
      <Input placeholder="Enter text" value="inputValue" onChange={handleInputChange} />
      <Checkbox label="Accept Terms" checked={false} onChange={handleCheckboxChange} />
      <Switch checked={false} onChange={handleSwitchChange} />
      <Link href="https://example.com">Go to Example</Link>
      <Avatar src="https://example.com/avatar.jpg" alt="User Avatar" />
      <Badge label="New" />
      <Icon name="IconName" color="primary" />
      <Divider />
      <Tooltip title="Tooltip text">Hover over me</Tooltip>
    </div>
  );
};

// Export the main component
export default Interface;
```