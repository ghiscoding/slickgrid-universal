import { forwardRef, useEffect } from 'react';

export const Example19Preload = forwardRef((props: any, ref: any) => {
  useEffect(() => {
    return () => {
      console.log('Preload unmounted');
    };
  }, []);

  return (
    <div ref={ref} className="container-fluid d-flex align-items-center" style={{ marginTop: '10px' }}>
      <i className="mdi mdi-sync mdi-spin mdi-50px"></i>
      <h4>Loading...</h4>
    </div>
  );
});
