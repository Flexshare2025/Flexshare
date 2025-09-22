import { SpinLoading } from 'antd-mobile';
import './index.scss';

export default function Loading() {
  return <SpinLoading className="loading-icon" style={{ '--size': '68px' }} />
}