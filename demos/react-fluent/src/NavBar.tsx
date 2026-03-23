import { Button, makeStyles, Toolbar } from '@fluentui/react-components';
import { Book20Color, Home20Regular } from '@fluentui/react-icons';
import React from 'react';
import ReactLogo from './assets/react-logo.png?url';

const useStyles = makeStyles({
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
  },
  navbarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginRight: 'auto',
    fontWeight: 600,
    marginLeft: '40px',
    textDecoration: 'none',
    color: 'inherit',
  },
  navLinks: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  logo: {
    height: '38px',
    width: 'auto',
  },
});

export const NavBar: React.FC = () => {
  const styles = useStyles();

  return (
    <Toolbar className={styles.toolbar}>
      {/* Brand Section */}
      <a
        href="https://github.com/ghiscoding/slickgrid-universal/tree/master/frameworks/slickgrid-react"
        target="_blank"
        className={styles.navbarBrand}
      >
        <i className="mdi mdi-github"></i>
        <span>Slickgrid-React</span>
        <img src={ReactLogo} className={styles.logo} alt="React Logo" />
      </a>

      {/* Navigation Links */}
      <div className={styles.navLinks}>
        <Button as="a" href="/#home" icon={<Home20Regular />} appearance="subtle" aria-label="Home" />
        <Button
          as="a"
          href="https://ghiscoding.gitbook.io/slickgrid-react/"
          target="_blank"
          icon={<Book20Color />}
          appearance="subtle"
          aria-label="Documentation"
        />
        <a href="https://github.com/ghiscoding/slickgrid-universal">
          <img src="https://img.shields.io/github/stars/ghiscoding/slickgrid-universal?style=social" alt="GitHub stars" />
        </a>
      </div>
    </Toolbar>
  );
};
