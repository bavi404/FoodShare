import React from 'react';

const steps = ['Posted', 'Claimed', 'Picked Up', 'Completed', 'Expired'];

const StatusStepper = ({ status }) => {
  const getStepIndex = (status) => {
    switch (status) {
      case 'available': return 0;
      case 'claimed': return 1;
      case 'approved': return 2;
      case 'picked-up': return 3;
      case 'expired': return 4;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(status);

  return (
    <div className="d-flex justify-content-between align-items-center my-2">
      {steps.map((step, index) => (
        <div key={index} className="text-center" style={{ flex: 1 }}>
          <div
            className={`rounded-circle mx-auto mb-1 ${index <= currentStep ? 'bg-success' : 'bg-secondary'}`}
            style={{
              width: 20,
              height: 20,
              display: 'inline-block'
            }}
          />
          <div style={{ fontSize: '0.75rem' }}>{step}</div>
        </div>
      ))}
    </div>
  );
};

export default StatusStepper;
