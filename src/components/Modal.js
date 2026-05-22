export function createModal({ title, content, actions = [], center = false, onClose }) {
  const overlay = document.createElement('div')
  overlay.className = `modal-overlay${center ? ' center' : ''}`
  overlay.setAttribute('role', 'dialog')
  overlay.setAttribute('aria-modal', 'true')
  overlay.setAttribute('aria-label', title || 'Dialog')

  const modal = document.createElement('div')
  modal.className = `modal${center ? ' center' : ''}`

  if (!center) {
    const handle = document.createElement('div')
    handle.className = 'modal-handle'
    modal.appendChild(handle)
  }

  if (title) {
    const titleEl = document.createElement('div')
    titleEl.className = 'modal-title'
    titleEl.textContent = title
    modal.appendChild(titleEl)
  }

  if (typeof content === 'string') {
    const contentEl = document.createElement('div')
    contentEl.innerHTML = content
    modal.appendChild(contentEl)
  } else if (content instanceof HTMLElement) {
    modal.appendChild(content)
  }

  if (actions.length > 0) {
    const actionsEl = document.createElement('div')
    actionsEl.className = 'modal-actions'
    actions.forEach(({ label, cls = 'btn-secondary', onClick }) => {
      const btn = document.createElement('button')
      btn.className = `btn ${cls}`
      btn.textContent = label
      btn.addEventListener('click', () => {
        if (onClick) onClick()
        close()
      })
      actionsEl.appendChild(btn)
    })
    modal.appendChild(actionsEl)
  }

  overlay.appendChild(modal)
  document.body.appendChild(overlay)

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) close()
  })

  document.addEventListener('keydown', onKeydown)

  function onKeydown(e) {
    if (e.key === 'Escape') close()
  }

  function close() {
    document.removeEventListener('keydown', onKeydown)
    overlay.remove()
    if (onClose) onClose()
  }

  return { close, overlay, modal }
}

export function confirmModal({ title, message, confirmLabel = 'Confirm', confirmCls = 'btn-danger', onConfirm, onCancel }) {
  return createModal({
    title,
    center: true,
    content: `<p style="color:var(--color-text-secondary);font-size:14px;margin-bottom:0;">${message}</p>`,
    actions: [
      { label: 'Cancel', cls: 'btn-secondary', onClick: onCancel },
      { label: confirmLabel, cls: confirmCls, onClick: onConfirm }
    ]
  })
}

export function alertModal({ title, message, buttonLabel = 'OK' }) {
  return createModal({
    title,
    center: true,
    content: `<p style="color:var(--color-text-secondary);font-size:14px;margin-bottom:0;">${message}</p>`,
    actions: [
      { label: buttonLabel, cls: 'btn-primary' }
    ]
  })
}

export function formModal({ title, fields = [], submitLabel = 'Save', onSubmit }) {
  const form = document.createElement('form')
  form.style.display = 'flex'
  form.style.flexDirection = 'column'
  form.style.gap = '1rem'

  const inputs = {}

  fields.forEach(({ name, label, type = 'text', placeholder = '', required = false, options = [] }) => {
    const group = document.createElement('div')
    group.className = 'form-group'
    group.style.marginBottom = '0'

    const labelEl = document.createElement('label')
    labelEl.textContent = label
    group.appendChild(labelEl)

    let input
    if (type === 'textarea') {
      input = document.createElement('textarea')
      input.rows = 3
    } else if (type === 'select') {
      input = document.createElement('select')
      options.forEach(opt => {
        const option = document.createElement('option')
        option.value = opt.value ?? opt
        option.textContent = opt.label ?? opt
        input.appendChild(option)
      })
    } else {
      input = document.createElement('input')
      input.type = type
    }

    input.name = name
    input.placeholder = placeholder
    if (required) input.required = true
    inputs[name] = input
    group.appendChild(input)
    form.appendChild(group)
  })

  const errorEl = document.createElement('div')
  errorEl.className = 'error-text'
  errorEl.style.display = 'none'
  form.appendChild(errorEl)

  let modalInstance

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.className = 'btn btn-primary btn-full'
  submitBtn.textContent = submitLabel
  form.appendChild(submitBtn)

  form.addEventListener('submit', async (e) => {
    e.preventDefault()
    const values = {}
    fields.forEach(({ name }) => {
      values[name] = inputs[name].value
    })
    try {
      submitBtn.disabled = true
      submitBtn.textContent = 'Saving...'
      await onSubmit(values)
      if (modalInstance) modalInstance.close()
    } catch (err) {
      errorEl.textContent = err.message
      errorEl.style.display = 'block'
      submitBtn.disabled = false
      submitBtn.textContent = submitLabel
    }
  })

  modalInstance = createModal({ title, content: form })
  return modalInstance
}
