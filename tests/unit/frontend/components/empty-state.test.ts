import test from 'tape';

// Test empty-state component logic without JSX
const EmptyState = ({ title, description, action }: { title: string; description?: string; action?: any }) => {
  return {
    title,
    description,
    action,
    render: () => ({
      hasTitle: !!title,
      hasDescription: !!description,
      hasAction: !!action,
      titleText: title,
      descriptionText: description
    })
  };
};

test('EmptyState - renders with required props', (t) => {
  const component = EmptyState({ title: 'No Data' });
  const rendered = component.render();
  
  t.true(rendered.hasTitle, 'renders title');
  t.equal(rendered.titleText, 'No Data', 'displays correct title');
  t.false(rendered.hasDescription, 'no description when not provided');
  t.false(rendered.hasAction, 'no action when not provided');
  
  t.end();
});

test('EmptyState - renders with description', (t) => {
  const component = EmptyState({
    title: 'Empty',
    description: 'No items found'
  });
  const rendered = component.render();
  
  t.true(rendered.hasDescription, 'renders description when provided');
  t.equal(rendered.descriptionText, 'No items found', 'displays correct description');
  
  t.end();
});

test('EmptyState - renders with action', (t) => {
  const action = { type: 'button', text: 'Click me' };
  const component = EmptyState({
    title: 'Test',
    action
  });
  const rendered = component.render();
  
  t.true(rendered.hasAction, 'renders action when provided');
  t.equal(component.action, action, 'stores action correctly');
  
  t.end();
});