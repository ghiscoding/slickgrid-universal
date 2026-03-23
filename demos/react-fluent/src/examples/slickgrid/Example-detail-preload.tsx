import { useEffect } from 'react';

export const ExampleDetailPreload = (props: any) => {
  const { ref, ...rest } = props;
  useEffect(() => {
    return () => {
      console.log('Preload unmounted');
    };
  }, []);

  return (
    <div ref={ref} className="container-fluid d-flex align-items-center" style={{ marginTop: '10px' }} {...rest}>
      <h4>Loading...</h4>
    </div>
  );
};
