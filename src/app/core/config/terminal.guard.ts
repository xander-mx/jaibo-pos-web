import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { TerminalService } from './terminal.service';

export const terminalGuard: CanActivateFn = () => {
  const terminalService = inject(TerminalService);
  const router = inject(Router);

  if (terminalService.getTerminalId()) {
    return true;
  }

  return router.createUrlTree(['/terminal-setup']);
};
