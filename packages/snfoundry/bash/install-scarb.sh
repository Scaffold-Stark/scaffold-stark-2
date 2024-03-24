#!/bin/bash

scarb_version=$(scarb --version)
version_254="scarb 2.5.4 (28dee92c8 2024-02-14)
cairo: 2.5.4 (https://crates.io/crates/cairo-lang-compiler/2.5.4)
sierra: 1.4.0"

if [ "$scarb_version" != "$version_254" ]; then
    echo "Installing scarb 2.5.4"
    curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh -s -- -v 2.5.4
fi
