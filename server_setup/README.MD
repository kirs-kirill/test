# Настройка окружения

## [oh-my-bash](https://github.com/ohmybash/oh-my-bash)

`.bashrc`

```
export OSH='/root/.oh-my-bash'
export TZ=Europe/Moscow
export THEME_CHECK_SUDO=false

#OSH_THEME="font"
OSH_THEME="powerbash10k"
OMB_USE_SUDO=true

completions=(
  git
  composer
  ssh
  docker
)

plugins=(
  git
  bashmarks
)
```


## [lsd](https://github.com/lsd-rs/lsd)

`.bashrc`

```
alias ll='lsd -l'
alias la='lsd -a'
alias lla='lsd -la'
alias tree='lsd --tree'
```

