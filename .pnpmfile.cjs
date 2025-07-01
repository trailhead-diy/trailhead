/**
 * pnpm hook file to automatically approve trusted build scripts
 * This prevents the warning about ignored build scripts
 */

module.exports = {
  hooks: {
    afterAllResolved(lockfile, context) {
      // Automatically approve build scripts for trusted dependencies
      const trustedPackages = [
        '@tailwindcss/oxide',
        'esbuild'
      ];

      // Add trusted packages to the build scripts approval list
      if (!lockfile.onlyBuiltDependencies) {
        lockfile.onlyBuiltDependencies = [];
      }

      for (const pkg of trustedPackages) {
        if (!lockfile.onlyBuiltDependencies.includes(pkg)) {
          lockfile.onlyBuiltDependencies.push(pkg);
        }
      }

      return lockfile;
    }
  }
};