import { Button } from 'antd-mobile';
import './index.scss';

export default function Header({ title, onBack, showBackButton = true }) {
  return (
    <div className='common-header'>
      {showBackButton ? (
        <Button
          fill='none'
          size='small'
          onClick={onBack}
          style={{
            color: '#1677ff',
            fontSize: '16px',
            padding: '8px 12px',
            border: 'none'
          }}
        >
          ←
        </Button>
      ) : (
        <div style={{ width: '60px' }}></div>
      )}

      <h2 style={{
        margin: 0,
        fontSize: '18px',
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center'
      }}>
        {title}
      </h2>

      <div style={{ width: '60px' }}></div> {/* placeholder to keep title centered */}
    </div>
  );
}
