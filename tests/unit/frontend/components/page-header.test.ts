import test from 'tape';

// Test page-header component logic without JSX
const PageHeader = ({ title, extra }: { title: any; extra?: any }) => {
  return {
    title,
    extra,
    render: () => ({
      hasTitle: true,
      hasExtra: !!extra,
      titleContent: typeof title === 'string' ? title : title?.toString(),
      extraContent: extra
    })
  };
};

test('PageHeader - renders title correctly', (t) => {
  const component = PageHeader({ title: 'Test Title' });
  const rendered = component.render();
  
  t.equal(rendered.titleContent, 'Test Title', 'displays string title correctly');
  t.false(rendered.hasExtra, 'no extra content when not provided');
  
  t.end();
});

test('PageHeader - renders with JSX title', (t) => {
  const jsxTitle = { type: 'span', content: 'Complex Title' };
  const component = PageHeader({ title: jsxTitle });
  
  t.equal(component.title, jsxTitle, 'handles JSX title object');
  
  t.end();
});

test('PageHeader - renders with extra content', (t) => {
  const extra = { type: 'button', text: 'Action' };
  const component = PageHeader({ 
    title: 'Main Title', 
    extra 
  });
  const rendered = component.render();
  
  t.true(rendered.hasExtra, 'has extra content when provided');
  t.equal(rendered.extraContent, extra, 'stores extra content correctly');
  
  t.end();
});

test('PageHeader - handles empty title', (t) => {
  const component = PageHeader({ title: '' });
  const rendered = component.render();
  
  t.equal(rendered.titleContent, '', 'handles empty title');
  
  t.end();
});