import { NavBar } from 'antd-mobile'


export default function App(props) {
  const defaultBack = () => {
    window.history.back();
  }

  const { back = defaultBack, text = 'Back', title = '' } = props || {};


  return (
    <NavBar back={text} onBack={back}>
      {title}
    </NavBar>
  )
}