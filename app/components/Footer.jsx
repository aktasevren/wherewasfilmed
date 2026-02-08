'use client';

import { Container } from 'react-bootstrap';
import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer-wrapper">
      <div className="footer-divider" aria-hidden="true" />
      <Container>
        <div className="footer-content">
          <p className="footer-tagline">Discover where movies and series were filmed.</p>
          <p className="footer-copy">© {currentYear} Where Was Filmed</p>
        </div>
      </Container>
    </footer>
  );
}
