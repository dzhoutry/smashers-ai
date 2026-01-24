import './StepProgressBar.css';

function StepProgressBar({ currentStep }) {
    const steps = [
        { number: 1, label: 'Upload' },
        { number: 2, label: 'Configure' },
        { number: 3, label: 'Results' }
    ];

    return (
        <div className="step-progress-bar">
            {steps.map((step, index) => (
                <div key={step.number} className="step-item-wrapper">
                    <div
                        className={`step-item ${currentStep === step.number ? 'active' : ''
                            } ${currentStep > step.number ? 'completed' : ''}`}
                    >
                        <span className="step-indicator">
                            {currentStep > step.number ? '✓' : step.number}
                        </span>
                        <span className="step-label">{step.label}</span>
                    </div>
                    {index < steps.length - 1 && (
                        <div className={`step-connector ${currentStep > step.number ? 'completed' : ''
                            }`} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default StepProgressBar;
