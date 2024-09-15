import { main } from './main';

describe('main.test.tsx', () => {
  let rootDiv: HTMLDivElement;

  beforeEach(() => {
    rootDiv = document.createElement('div');
    rootDiv.id = 'root';
    rootDiv.setAttribute('id', 'root');

    document.body.appendChild(rootDiv);
  });

  afterEach(() => {
    document.body.removeChild(rootDiv);
  });

  it('should mount the root component successfully', () => {
    main();
  });
});
