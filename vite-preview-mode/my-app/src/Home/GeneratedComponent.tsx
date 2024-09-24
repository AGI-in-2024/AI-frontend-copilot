import React from 'react';
import { Sidebar, Header, Box, Input, Button, Divider, Tabs } from '@nlmk/ds-2.0';

const Interface = () => {
  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar orientation="vertical" allowFavorites={true} isLoggedIn={false} currentPath="/" />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header title="Заголовок страницы" bg={true} />
        <Box p="var(--16-space)" flex="1" display="flex" flexDirection="column" gap="var(--16-space)">
          <Box display="flex" gap="var(--8-space)" flexWrap="wrap">
            <Input label="Поле ввода 1" name="input1" />
            <Input label="Поле ввода 2" name="input2" />
            <Input label="Поле ввода 3" name="input3" />
            <Input label="Поле ввода 4" name="input4" />
            <Input label="Поле ввода 5" name="input5" />
            <Input label="Поле ввода 6" name="input6" />
            <Input label="Поле ввода 7" name="input7" />
            <Input label="Поле ввода 8" name="input8" />
            <Input label="Поле ввода 9" name="input9" />
            <Box display="flex" gap="var(--8-space)">
              <Button>Кнопка 1</Button>
              <Button>Кнопка 2</Button>
            </Box>
          </Box>
          <Divider dashed={true} />
          <Tabs>
            <Tabs.Tab label="Вкладка 1" active={true} />
            <Tabs.Tab label="Вкладка 2" active={false} />
          </Tabs>
          <Box display="flex" flexDirection="column" gap="var(--8-space)">
            <Input label="Поле ввода 10" name="input10" />
            <Input label="Поле ввода 11" name="input11" />
            <Input label="Поле ввода 12" name="input12" />
            <Input label="Поле ввода 13" name="input13" />
            <Input label="Поле ввода 14" name="input14" />
            <Input label="Поле ввода 15" name="input15" />
            <Input label="Поле ввода 16" name="input16" />
            <Input label="Поле ввода 17" name="input17" />
            <Input label="Поле ввода 18" name="input18" />
            <Input label="Поле ввода 19" name="input19" />
            <Input label="Поле ввода 20" name="input20" />
          </Box>
          <Box display="flex" gap="var(--8-space)" justifyContent="flex-end">
            <Button>Кнопка 1</Button>
            <Button>Кнопка 2</Button>
          </Box>
        </Box>
      </div>
    </div>
  );
};

export default Interface;